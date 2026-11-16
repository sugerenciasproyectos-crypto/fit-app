// Edge Function health-sync (TRD §6.4, Backend Schema §6). La llama el atajo de iOS con el token
// personal (no un JWT de Supabase), así que se despliega con --no-verify-jwt y valida el token aquí.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  dailyMaxAcrossSources,
  earliestWeightPerDay,
  sha256,
  shouldReplaceWeight,
  validateSamples,
} from '../_shared/health.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const EXPORT_LIMIT = 200;
const UUID = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  // 1. Token personal → usuario
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'Falta el token' }, 401);
  const { data: tok } = await db
    .from('api_tokens')
    .select('id, user_id')
    .eq('token_hash', await sha256(token))
    .is('revoked_at', null)
    .maybeSingle();
  if (!tok) return json({ error: 'Token no válido o revocado' }, 401);
  const uid = tok.user_id as string;
  await db.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', tok.id);

  let body: { samples?: unknown; ack_exported?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON no válido' }, 400);
  }

  try {
    // 2. Confirmar lo exportado en la ejecución anterior
    const ack = Array.isArray(body.ack_exported)
      ? body.ack_exported.filter((x): x is string => typeof x === 'string' && UUID.test(x)).slice(0, 1000)
      : [];
    if (ack.length) {
      const { error } = await db
        .from('diary_entries')
        .update({ exported_at: new Date().toISOString(), export_dirty: false })
        .eq('user_id', uid)
        .in('id', ack);
      if (error) throw error;
    }

    // 3. Muestras: validar e insertar con deduplicación por external_id
    const { ok, errors } = await validateSamples(body.samples ?? []);
    let inserted: { id: string; external_id: string }[] = [];
    if (ok.length) {
      const { data, error } = await db
        .from('health_samples')
        .upsert(
          ok.map((s) => ({
            user_id: uid,
            type: s.type,
            value: s.value,
            unit: s.unit ?? (s.type === 'weight' ? 'kg' : s.type === 'steps' ? 'count' : 'kcal'),
            start_at: s.start,
            end_at: s.end,
            source_name: s.source,
            external_id: s.external_id,
          })),
          { onConflict: 'user_id,external_id', ignoreDuplicates: true },
        )
        .select('id, external_id');
      if (error) throw error;
      inserted = data ?? [];
    }
    const newIds = new Map(inserted.map((r) => [r.external_id, r.id]));
    const fresh = ok.filter((s) => newIds.has(s.external_id));

    // 4. Peso del día: el manual manda; si no, la muestra más temprana
    let weights = 0;
    for (const [day, s] of earliestWeightPerDay(fresh)) {
      const { data: cur } = await db
        .from('weights')
        .select('source, measured_at')
        .eq('user_id', uid)
        .eq('day', day)
        .maybeSingle();
      if (!shouldReplaceWeight(cur, s.start)) continue;
      const { error } = await db.from('weights').upsert(
        {
          user_id: uid,
          day,
          weight_kg: s.value,
          source: 'health',
          measured_at: s.start,
          sample_id: newIds.get(s.external_id),
        },
        { onConflict: 'user_id,day' },
      );
      if (error) throw error;
      weights++;
    }

    // 5. Pasos y energía activa: recalcular los días afectados (máximo entre fuentes)
    const days = [...new Set(fresh.filter((s) => s.type !== 'weight').map((s) => s.day))];
    if (days.length) {
      const minDay = days.sort()[0]!;
      const { data: all, error } = await db
        .from('health_samples')
        .select('type, value, start_at, source_name')
        .eq('user_id', uid)
        .in('type', ['steps', 'active_kcal'])
        .gte('start_at', `${minDay}T00:00:00+02:00`);
      if (error) throw error;
      const { madridDay } = await import('../_shared/health.ts');
      const rows = (all ?? []).map((r) => ({
        type: r.type as 'steps' | 'active_kcal',
        value: Number(r.value),
        day: madridDay(r.start_at as string),
        source: r.source_name as string | null,
      }));
      const steps = dailyMaxAcrossSources(rows, 'steps');
      const active = dailyMaxAcrossSources(rows, 'active_kcal');
      const upserts = days.map((day) => ({
        user_id: uid,
        day,
        steps: steps.has(day) ? Math.round(steps.get(day)!) : null,
        active_kcal: active.has(day) ? Math.round(active.get(day)! * 10) / 10 : null,
        updated_at: new Date().toISOString(),
      }));
      const { error: e2 } = await db.from('daily_activity').upsert(upserts, { onConflict: 'user_id,day' });
      if (e2) throw e2;
    }

    // 6. Registros pendientes de exportar a Salud
    const { data: pending, error: e3 } = await db
      .from('diary_entries')
      .select('id, logged_at, energy_kcal, protein_g, carbs_g, fat_g, fiber_g, sugars_g, saturated_fat_g')
      .eq('user_id', uid)
      .is('exported_at', null)
      .order('logged_at')
      .limit(EXPORT_LIMIT);
    if (e3) throw e3;

    const count = (t: string) => fresh.filter((s) => s.type === t).length;
    return json({
      imported: {
        weight: count('weight'),
        weight_days_updated: weights,
        steps: count('steps'),
        active_kcal: count('active_kcal'),
        duplicates: ok.length - fresh.length,
      },
      errors,
      acknowledged: ack.length,
      to_export: (pending ?? []).map(({ logged_at, ...r }) => ({ ...r, at: logged_at })),
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

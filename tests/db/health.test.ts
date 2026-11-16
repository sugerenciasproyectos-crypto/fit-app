import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { signIn, type Client } from './client';
import { env } from './env';

let db: Client;
let uid: string;
let token: string;
const url = () => `${env('VITE_SUPABASE_URL')}/functions/v1/health-sync`;

async function sync(body: unknown, t = token) {
  const r = await fetch(url(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}

const D1 = '2025-03-10';
const D2 = '2025-03-11';
const samples = [
  { type: 'weight', value: 80.2, unit: 'kg', start: `${D1}T20:00:00+01:00`, source: 'Reloj' },
  { type: 'weight', value: 79.6, unit: 'kg', start: `${D1}T07:30:00+01:00`, source: 'Reloj' },
  { type: 'weight', value: 79.4, unit: 'kg', start: `${D2}T07:30:00+01:00`, source: 'Reloj' },
  {
    type: 'steps',
    value: 6000,
    start: `${D1}T08:00:00+01:00`,
    end: `${D1}T12:00:00+01:00`,
    source: 'Reloj',
  },
  {
    type: 'steps',
    value: 3000,
    start: `${D1}T13:00:00+01:00`,
    end: `${D1}T18:00:00+01:00`,
    source: 'Reloj',
  },
  {
    type: 'steps',
    value: 7000,
    start: `${D1}T00:00:00+01:00`,
    end: `${D1}T23:59:00+01:00`,
    source: 'iPhone',
  },
  {
    type: 'active_kcal',
    value: 450,
    start: `${D1}T00:00:00+01:00`,
    end: `${D1}T23:59:00+01:00`,
    source: 'Reloj',
  },
];

async function cleanup() {
  await db.from('weights').delete().in('day', [D1, D2]);
  await db.from('daily_activity').delete().in('day', [D1, D2]);
  await db
    .from('health_samples')
    .delete()
    .gte('start_at', `${D1}T00:00:00Z`)
    .lte('start_at', `${D2}T23:59:59Z`);
  await db.from('diary_entries').delete().eq('product_name', 'ZZ Export');
}

beforeAll(async () => {
  ({ db, id: uid } = await signIn('B'));
  await cleanup();
  const { data, error } = await db.rpc('create_api_token');
  if (error) throw error;
  token = data;
});
afterAll(async () => {
  await cleanup();
  await db.rpc('revoke_api_token');
});

describe('10.1 token', () => {
  it('solo se guarda el hash y no se puede leer', async () => {
    expect(token).toMatch(/^cal_[0-9a-f]{64}$/);
    const { data, error } = await db.from('api_tokens').select('token_hash');
    expect(error !== null || data?.length === 0).toBe(true);
  });
  it('sin token o con uno falso: 401', async () => {
    expect((await sync({ samples: [] }, 'cal_falso')).status).toBe(401);
  });
});

describe('10.2 entrada', () => {
  it('importa, elige el peso más temprano y el máximo de pasos entre fuentes', async () => {
    const r = await sync({ samples });
    expect(r.status).toBe(200);
    expect(r.body.imported).toMatchObject({ weight: 3, steps: 3, active_kcal: 1, duplicates: 0 });
    const { data: w } = await db
      .from('weights')
      .select('day, weight_kg, source')
      .in('day', [D1, D2])
      .order('day');
    expect(w).toEqual([
      { day: D1, weight_kg: 79.6, source: 'health' },
      { day: D2, weight_kg: 79.4, source: 'health' },
    ]);
    const { data: a } = await db
      .from('daily_activity')
      .select('steps, active_kcal')
      .eq('day', D1)
      .single();
    expect(a).toEqual({ steps: 9000, active_kcal: 450 });
  });

  it('enviar el mismo lote dos veces: todo duplicados y ningún cambio', async () => {
    const r = await sync({ samples });
    expect(r.body.imported).toMatchObject({ weight: 0, steps: 0, duplicates: samples.length });
  });

  it('el peso manual manda sobre Salud', async () => {
    await db
      .from('weights')
      .update({ source: 'manual', weight_kg: 81, measured_at: `${D2}T09:00:00+01:00` })
      .eq('day', D2);
    await sync({
      samples: [{ type: 'weight', value: 78, start: `${D2}T06:00:00+01:00`, source: 'Báscula' }],
    });
    const { data } = await db.from('weights').select('weight_kg, source').eq('day', D2).single();
    expect(data).toEqual({ weight_kg: 81, source: 'manual' });
  });
});

describe('10.3 salida', () => {
  it('lo no confirmado se reenvía; al confirmar se rellena exported_at', async () => {
    const { data: slot } = await db.from('meal_slots').select('id').limit(1).single();
    const { data: e } = await db
      .from('diary_entries')
      .insert({
        user_id: uid,
        day: D1,
        meal_slot_id: slot!.id,
        quantity: 100,
        unit: 'g',
        product_name: 'ZZ Export',
        per100: {},
        energy_kcal: 250,
        protein_g: 10,
      })
      .select('id')
      .single();
    const first = await sync({ samples: [] });
    expect(first.body.to_export.map((x: { id: string }) => x.id)).toContain(e!.id);
    const again = await sync({ samples: [] });
    expect(again.body.to_export.map((x: { id: string }) => x.id)).toContain(e!.id);
    const acked = await sync({ samples: [], ack_exported: [e!.id] });
    expect(acked.body.acknowledged).toBe(1);
    expect(acked.body.to_export.map((x: { id: string }) => x.id)).not.toContain(e!.id);
    const { data: row } = await db
      .from('diary_entries')
      .select('exported_at')
      .eq('id', e!.id)
      .single();
    expect(row!.exported_at).not.toBeNull();
  });
});

describe('10.1 revocación', () => {
  it('un token revocado devuelve 401', async () => {
    const { data: t2 } = await db.rpc('create_api_token');
    expect((await sync({ samples: [] })).status).toBe(401); // el anterior quedó revocado
    expect((await sync({ samples: [] }, t2!)).status).toBe(200);
    token = t2!;
  });
});

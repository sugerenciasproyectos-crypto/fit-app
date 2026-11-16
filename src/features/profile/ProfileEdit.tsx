import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useToday } from '../../lib/useToday';
import { fmtKg, parseDecimal } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { Button } from '../../ui/primitives';
import { profileKey, useLastWeight, useProfile, type Profile } from './api';
import { emptyDraft, toInput, validateBody, validateGoal, type ProfileDraft } from './form';
import { BodyFields, GoalFields, TargetsPreview } from './ProfileFields';
import { computeTargets } from './targets';

function fromProfile(p: Profile, weightKg: number): ProfileDraft {
  const s = (n: number) => String(n).replace('.', ',');
  return {
    ...emptyDraft,
    sex: p.sex,
    birth_date: p.birth_date,
    height_cm: s(p.height_cm),
    weight_kg: s(weightKg),
    activity: p.activity,
    goal: p.goal,
    kcal_adjust: String(p.kcal_adjust),
    protein_g_per_kg: s(p.protein_g_per_kg),
    fat_pct: s(Math.round(p.fat_pct * 100)),
    body_fat_pct: p.body_fat_pct == null ? '' : s(p.body_fat_pct),
    use_katch: p.use_katch,
  };
}

/** D10 Perfil y objetivo. El TDEE vigente (adaptativo) no cambia aquí salvo que cambie la actividad. */
export default function ProfileEdit() {
  const profile = useProfile();
  const weight = useLastWeight();
  if (!profile.data || weight.isLoading) return <p className="py-6 text-ink-2">Cargando…</p>;
  return <Editor profile={profile.data} weightKg={weight.data?.weight_kg ?? 70} />;
}

function Editor({ profile, weightKg }: { profile: Profile; weightKg: number }) {
  const qc = useQueryClient();
  const today = useToday();
  const [draft, setDraft] = useState(() => fromProfile(profile, weightKg));
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | string>('idle');
  const set = (patch: Partial<ProfileDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setStatus('idle');
  };
  const errors = { ...validateBody(draft, today), ...validateGoal(draft) };
  const input = toInput(draft, today);
  // Cambiar actividad o el cuerpo reinicia el TDEE a TDEE_0; si no, se mantiene el vigente.
  const resetsTdee =
    input !== null &&
    (input.activity !== profile.activity ||
      input.sex !== profile.sex ||
      input.birth_date !== profile.birth_date ||
      input.height_cm !== profile.height_cm ||
      input.use_katch !== profile.use_katch ||
      input.body_fat_pct !== profile.body_fat_pct);
  const targets = useMemo(
    () =>
      input
        ? computeTargets(input, weightKg, today, resetsTdee ? undefined : profile.tdee_current)
        : null,
    [input, weightKg, today, resetsTdee, profile.tdee_current],
  );

  async function save() {
    if (!input || !targets) return;
    setStatus('saving');
    const tdee = Math.round(targets.tdee * 10) / 10;
    const { error } = await supabase
      .from('profiles')
      .update({
        ...input,
        ...(resetsTdee ? { tdee_initial: tdee, tdee_current: tdee } : {}),
      })
      .eq('user_id', profile.user_id);
    if (error) return setStatus(error.message);
    await qc.invalidateQueries({ queryKey: profileKey });
    setStatus('saved');
  }

  return (
    <div className="grid gap-6 py-4">
      <header className="flex items-baseline justify-between">
        <h1 className="num text-2xl">Perfil y objetivo</h1>
        <Link to="/ajustes" className="text-action underline">
          Ajustes
        </Link>
      </header>
      <p className="text-sm text-ink-2">
        Peso de referencia: <span className="num">{fmtKg(weightKg)} kg</span> (último registrado).
      </p>
      <BodyFields draft={draft} errors={errors} set={set} showWeight={false} />
      <GoalFields draft={draft} errors={errors} set={set} />
      <TargetsPreview t={targets} adjust={parseDecimal(draft.kcal_adjust)} />
      {resetsTdee && (
        <p className="text-sm text-ink-2">
          Al guardar, el TDEE vuelve a calcularse con la fórmula y se descarta el ajuste adaptativo.
        </p>
      )}
      <div aria-live="polite" className="text-sm">
        {status === 'saved' && <span className="text-ink-2">Guardado.</span>}
        {status !== 'idle' && status !== 'saving' && status !== 'saved' && (
          <span className="text-alert">No se guardó: {status}</span>
        )}
      </div>
      <Button onClick={save} disabled={!targets || status === 'saving'}>
        {status === 'saving' ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  );
}

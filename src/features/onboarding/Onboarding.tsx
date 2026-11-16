import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useToday } from '../../lib/useToday';
import { parseDecimal } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { Button } from '../../ui/primitives';
import { useUserId } from '../auth/useAuth';
import { profileKey, useProfile } from '../profile/api';
import {
  emptyDraft,
  toInput,
  validateBody,
  validateGoal,
  type ProfileDraft,
} from '../profile/form';
import { BodyFields, GoalFields, TargetsPreview } from '../profile/ProfileFields';
import { computeTargets } from '../profile/targets';

const STORAGE = 'onboarding-draft-v1';

interface Saved {
  step: 1 | 2 | 3;
  draft: ProfileDraft;
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    /* sin almacenamiento: se empieza de cero */
  }
  return { step: 1, draft: emptyDraft };
}

function persist(s: Saved | null) {
  try {
    if (s) localStorage.setItem(STORAGE, JSON.stringify(s));
    else localStorage.removeItem(STORAGE);
  } catch {
    /* ignorar */
  }
}

export default function Onboarding() {
  const userId = useUserId();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const profile = useProfile();
  const today = useToday();
  const [state, setState] = useState<Saved>(load);
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => persist(state), [state]);

  const { step, draft } = state;
  const set = (patch: Partial<ProfileDraft>) =>
    setState((s) => ({ ...s, draft: { ...s.draft, ...patch } }));
  const bodyErrors = validateBody(draft, today);
  const goalErrors = validateGoal(draft);
  const input = toInput(draft, today);
  const weight = parseDecimal(draft.weight_kg);
  const targets = useMemo(
    () => (input && weight ? computeTargets(input, weight, today) : null),
    [input, weight, today],
  );

  // Perfil ya guardado (p. ej. se cerró en P3): se retoma en P3; si no hay borrador, a Hoy.
  if (profile.data && step !== 3) return <Navigate to="/" replace />;

  async function save() {
    if (!input || !weight || !targets) return;
    setBusy(true);
    setSaveError(null);
    const { error } = await supabase.from('profiles').upsert({
      user_id: userId,
      ...input,
      tdee_initial: Math.round(targets.tdee0 * 10) / 10,
      tdee_current: Math.round(targets.tdee0 * 10) / 10,
      tracking_start: today,
    });
    if (!error) {
      const w = await supabase.from('weights').upsert(
        {
          user_id: userId,
          day: today,
          weight_kg: weight,
          source: 'manual',
          measured_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,day' },
      );
      if (w.error) setSaveError(w.error.message);
    } else setSaveError(error.message);
    setBusy(false);
    if (!error) {
      await qc.invalidateQueries({ queryKey: profileKey });
      setState((s) => ({ ...s, step: 3 }));
    }
  }

  function finish() {
    persist(null);
    navigate('/', { replace: true });
  }

  return (
    <main className="pt-safe mx-auto grid max-w-[480px] gap-6 px-4 pb-10">
      <header>
        <p className="num text-xs tracking-[0.12em] text-ink-2">PASO {step} DE 3</p>
        <h1 className="num text-2xl">
          {step === 1 ? 'Tu perfil' : step === 2 ? 'Objetivo y macros' : 'Extras opcionales'}
        </h1>
      </header>

      {step === 1 && (
        <>
          <BodyFields draft={draft} errors={showErrors ? bodyErrors : {}} set={set} />
          <Button
            onClick={() => {
              if (Object.keys(bodyErrors).length) return setShowErrors(true);
              setShowErrors(false);
              setState((s) => ({ ...s, step: 2 }));
            }}
          >
            Siguiente
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <GoalFields draft={draft} errors={goalErrors} set={set} />
          <TargetsPreview t={targets} adjust={parseDecimal(draft.kcal_adjust)} />
          {saveError && (
            <p role="alert" className="text-sm text-alert">
              No se guardó: {saveError}
            </p>
          )}
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <Button variant="ghost" onClick={() => setState((s) => ({ ...s, step: 1 }))}>
              Atrás
            </Button>
            <Button onClick={save} disabled={!targets || busy}>
              {busy ? 'Guardando…' : 'Guardar y seguir'}
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className="text-ink-2">
            Puedes configurar Apple Salud o importar productos más tarde desde Ajustes y Productos.
          </p>
          <Button onClick={finish}>Empezar</Button>
        </>
      )}
    </main>
  );
}

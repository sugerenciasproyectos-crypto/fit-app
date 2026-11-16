import type { Activity, Goal } from '../../domain/energy';
import { ADJUST_RANGE } from '../../domain/energy';
import { fmtG, fmtKcal } from '../../lib/format';
import { Leader, SectionTitle, SelectField, TextField } from '../../ui/primitives';
import { ACTIVITY_LABEL, GOAL_LABEL, type Errors, type ProfileDraft } from './form';
import type { Targets } from './targets';

interface Props {
  draft: ProfileDraft;
  errors: Errors;
  set: (patch: Partial<ProfileDraft>) => void;
}

export function BodyFields({
  draft,
  errors,
  set,
  showWeight = true,
}: Props & { showWeight?: boolean }) {
  return (
    <div className="grid gap-4">
      <fieldset className="grid gap-1">
        <legend className="mb-1 text-sm text-ink-2">Sexo</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['male', 'female'] as const).map((s) => (
            <label
              key={s}
              className={`flex min-h-11 items-center justify-center rounded border ${
                draft.sex === s ? 'border-ink font-semibold' : 'border-rule'
              }`}
            >
              <input
                type="radio"
                name="sex"
                className="sr-only"
                checked={draft.sex === s}
                onChange={() => set({ sex: s })}
              />
              {s === 'male' ? 'Hombre' : 'Mujer'}
            </label>
          ))}
        </div>
        {errors.sex && <p className="text-sm text-alert">{errors.sex}</p>}
      </fieldset>
      <TextField
        label="Fecha de nacimiento"
        type="date"
        value={draft.birth_date}
        error={errors.birth_date}
        onChange={(e) => set({ birth_date: e.target.value })}
      />
      <TextField
        label="Altura"
        inputMode="decimal"
        suffix="cm"
        value={draft.height_cm}
        error={errors.height_cm}
        onChange={(e) => set({ height_cm: e.target.value })}
      />
      {showWeight && (
        <TextField
          label="Peso actual"
          inputMode="decimal"
          suffix="kg"
          value={draft.weight_kg}
          error={errors.weight_kg}
          onChange={(e) => set({ weight_kg: e.target.value })}
        />
      )}
      <SelectField
        label="Actividad"
        value={draft.activity}
        onChange={(e) => set({ activity: e.target.value as Activity })}
      >
        {Object.entries(ACTIVITY_LABEL).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

export function GoalFields({ draft, errors, set }: Props) {
  return (
    <div className="grid gap-4">
      <fieldset>
        <legend className="mb-1 text-sm text-ink-2">Objetivo</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
            <label
              key={g}
              className={`flex min-h-11 items-center justify-center rounded border ${
                draft.goal === g ? 'border-ink font-semibold' : 'border-rule'
              }`}
            >
              <input
                type="radio"
                name="goal"
                className="sr-only"
                checked={draft.goal === g}
                onChange={() => set({ goal: g, kcal_adjust: String(ADJUST_RANGE[g].default) })}
              />
              {GOAL_LABEL[g]}
            </label>
          ))}
        </div>
      </fieldset>
      <TextField
        label="Ajuste diario"
        inputMode="numeric"
        suffix="kcal"
        disabled={draft.goal === 'maintain'}
        value={draft.kcal_adjust}
        error={errors.kcal_adjust}
        hint={`${ADJUST_RANGE[draft.goal].min} a ${ADJUST_RANGE[draft.goal].max} kcal`}
        onChange={(e) => set({ kcal_adjust: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Proteína"
          inputMode="decimal"
          suffix="g/kg"
          value={draft.protein_g_per_kg}
          error={errors.protein_g_per_kg}
          onChange={(e) => set({ protein_g_per_kg: e.target.value })}
        />
        <TextField
          label="Grasa"
          inputMode="decimal"
          suffix="%"
          value={draft.fat_pct}
          error={errors.fat_pct}
          onChange={(e) => set({ fat_pct: e.target.value })}
        />
      </div>
      <TextField
        label="Grasa corporal (opcional)"
        inputMode="decimal"
        suffix="%"
        value={draft.body_fat_pct}
        error={errors.body_fat_pct}
        onChange={(e) => set({ body_fat_pct: e.target.value })}
      />
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="size-5 accent-[var(--action)]"
          checked={draft.use_katch}
          onChange={(e) => set({ use_katch: e.target.checked })}
        />
        Usar Katch-McArdle (con grasa corporal)
      </label>
    </div>
  );
}

/** Desglose transparente de TMB → TDEE → objetivo → macros. */
export function TargetsPreview({ t, adjust }: { t: Targets | null; adjust: number | null }) {
  return (
    <section
      aria-label="Tu objetivo"
      aria-live="polite"
      className="grid gap-1 border-y border-dashed border-rule py-3"
    >
      <SectionTitle>Tu objetivo diario</SectionTitle>
      {t ? (
        <>
          <Leader label="TMB" value={`${fmtKcal(t.bmr)} kcal`} />
          <Leader label="TDEE" value={`${fmtKcal(t.tdee)} kcal`} />
          <Leader label="Ajuste" value={`${adjust! > 0 ? '+' : ''}${fmtKcal(adjust!)} kcal`} />
          <Leader label="OBJETIVO" value={`${fmtKcal(t.kcal)} kcal`} strong />
          <Leader label="P" value={`${fmtG(t.proteinG)} g`} />
          <Leader label="C" value={`${fmtG(t.carbsG)} g`} />
          <Leader label="G" value={`${fmtG(t.fatG)} g`} />
        </>
      ) : (
        <p className="text-sm text-ink-2">Completa los datos para ver el cálculo.</p>
      )}
    </section>
  );
}

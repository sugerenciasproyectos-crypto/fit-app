/** Estado del formulario de perfil (P1, P2 y D10) con valores como texto, y su validación. */
import { ageOn, type Day } from '../../domain/dates';
import { ADJUST_RANGE, type Activity, type Goal, type Sex } from '../../domain/energy';
import { parseDecimal } from '../../lib/format';
import type { ProfileInput } from './targets';

export interface ProfileDraft {
  sex: Sex | '';
  birth_date: string;
  height_cm: string;
  weight_kg: string;
  activity: Activity;
  goal: Goal;
  kcal_adjust: string;
  protein_g_per_kg: string;
  fat_pct: string; // en %, p. ej. "27"
  body_fat_pct: string;
  use_katch: boolean;
}

export const emptyDraft: ProfileDraft = {
  sex: '',
  birth_date: '',
  height_cm: '',
  weight_kg: '',
  activity: 'moderate',
  goal: 'lose',
  kcal_adjust: '-400',
  protein_g_per_kg: '1,8',
  fat_pct: '27',
  body_fat_pct: '',
  use_katch: false,
};

export type Errors = Partial<Record<keyof ProfileDraft, string>>;

export function validateBody(d: ProfileDraft, today: Day): Errors {
  const e: Errors = {};
  if (!d.sex) e.sex = 'Elige una opción';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.birth_date)) e.birth_date = 'Fecha no válida';
  else {
    const age = ageOn(d.birth_date, today);
    if (age < 14 || age > 100) e.birth_date = 'La edad debe estar entre 14 y 100 años';
  }
  const h = parseDecimal(d.height_cm);
  if (h === null || h < 120 || h > 230) e.height_cm = 'Entre 120 y 230 cm';
  const w = parseDecimal(d.weight_kg);
  if (w === null || w < 30 || w > 300) e.weight_kg = 'Entre 30 y 300 kg';
  return e;
}

export function validateGoal(d: ProfileDraft): Errors {
  const e: Errors = {};
  const r = ADJUST_RANGE[d.goal];
  const adj = parseDecimal(d.kcal_adjust);
  if (adj === null || adj < r.min || adj > r.max) {
    e.kcal_adjust = r.min === r.max ? 'Debe ser 0' : `Entre ${r.min} y ${r.max} kcal`;
  }
  const p = parseDecimal(d.protein_g_per_kg);
  if (p === null || p < 1.4 || p > 2) e.protein_g_per_kg = 'Entre 1,4 y 2,0 g/kg';
  const f = parseDecimal(d.fat_pct);
  if (f === null || f < 25 || f > 30) e.fat_pct = 'Entre 25 y 30 %';
  if (d.body_fat_pct.trim()) {
    const bf = parseDecimal(d.body_fat_pct);
    if (bf === null || bf < 3 || bf > 60) e.body_fat_pct = 'Entre 3 y 60 %';
  } else if (d.use_katch) e.body_fat_pct = 'Necesario para Katch-McArdle';
  return e;
}

/** Convierte un borrador válido en la entrada de cálculo. Devuelve null si no es válido. */
export function toInput(d: ProfileDraft, today: Day): ProfileInput | null {
  if (Object.keys({ ...validateBody(d, today), ...validateGoal(d) }).length) return null;
  const bf = d.body_fat_pct.trim() ? parseDecimal(d.body_fat_pct) : null;
  return {
    sex: d.sex as Sex,
    birth_date: d.birth_date,
    height_cm: parseDecimal(d.height_cm)!,
    activity: d.activity,
    goal: d.goal,
    kcal_adjust: parseDecimal(d.kcal_adjust)!,
    protein_g_per_kg: parseDecimal(d.protein_g_per_kg)!,
    fat_pct: parseDecimal(d.fat_pct)! / 100,
    body_fat_pct: bf,
    use_katch: d.use_katch && bf !== null,
  };
}

export const ACTIVITY_LABEL: Record<Activity, string> = {
  sedentary: 'Sedentaria (×1,2)',
  light: 'Ligera, 1–3 días (×1,375)',
  moderate: 'Moderada, 3–5 días (×1,55)',
  active: 'Alta, 6–7 días (×1,725)',
  very_active: 'Muy alta (×1,9)',
};

export const GOAL_LABEL: Record<Goal, string> = {
  lose: 'Perder',
  maintain: 'Mantener',
  gain: 'Ganar',
};

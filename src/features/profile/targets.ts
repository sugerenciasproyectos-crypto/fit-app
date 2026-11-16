/** Del perfil a los objetivos diarios (TRD §7.1–7.3). */
import { ageOn, type Day } from '../../domain/dates';
import {
  bmr,
  macros,
  targetKcal,
  tdeeInitial,
  type Activity,
  type Goal,
  type Macros,
  type Sex,
} from '../../domain/energy';

export interface ProfileInput {
  sex: Sex;
  birth_date: Day;
  height_cm: number;
  activity: Activity;
  goal: Goal;
  kcal_adjust: number;
  protein_g_per_kg: number;
  fat_pct: number;
  body_fat_pct: number | null;
  use_katch: boolean;
}

export interface Targets extends Macros {
  bmr: number;
  tdee0: number;
  tdee: number;
  kcal: number;
}

/** `tdee` es el TDEE vigente (adaptativo); si no se da, se usa TDEE_0. */
export function computeTargets(
  p: ProfileInput,
  weightKg: number,
  today: Day,
  tdee?: number,
): Targets {
  const b = bmr({
    sex: p.sex,
    weightKg,
    heightCm: p.height_cm,
    age: ageOn(p.birth_date, today),
    bodyFatPct: p.body_fat_pct,
    useKatch: p.use_katch,
  });
  const tdee0 = tdeeInitial(b, p.activity);
  const current = tdee ?? tdee0;
  const kcal = targetKcal(current, p.kcal_adjust, p.sex);
  return {
    bmr: b,
    tdee0,
    tdee: current,
    kcal,
    ...macros(kcal, weightKg, p.protein_g_per_kg, p.fat_pct),
  };
}

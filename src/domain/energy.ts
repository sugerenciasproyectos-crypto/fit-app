/** TRD §7.1–7.3. Sin redondeo interno. */
export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const KCAL_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };

export const ADJUST_RANGE: Record<Goal, { min: number; max: number; default: number }> = {
  lose: { min: -500, max: -300, default: -400 },
  maintain: { min: 0, max: 0, default: 0 },
  gain: { min: 150, max: 300, default: 250 },
};

export function bmrMifflin(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
}

export function bmrKatch(weightKg: number, bodyFatPct: number): number {
  return 370 + 21.6 * weightKg * (1 - bodyFatPct / 100);
}

export interface BmrInput {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  bodyFatPct?: number | null;
  useKatch?: boolean;
}

export function bmr(i: BmrInput): number {
  if (i.useKatch && i.bodyFatPct != null) return bmrKatch(i.weightKg, i.bodyFatPct);
  return bmrMifflin(i.sex, i.weightKg, i.heightCm, i.age);
}

export function tdeeInitial(bmrKcal: number, activity: Activity): number {
  return bmrKcal * ACTIVITY_FACTOR[activity];
}

export function isValidAdjust(goal: Goal, adjust: number): boolean {
  const r = ADJUST_RANGE[goal];
  return adjust >= r.min && adjust <= r.max;
}

/** objetivo = TDEE + ajuste, con el suelo por sexo. */
export function targetKcal(tdee: number, adjust: number, sex: Sex): number {
  return Math.max(KCAL_FLOOR[sex], tdee + adjust);
}

export interface Macros {
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export function macros(
  target: number,
  weightKg: number,
  proteinGPerKg = 1.8,
  fatPct = 0.27,
): Macros {
  const proteinG = proteinGPerKg * weightKg;
  const fatG = (target * fatPct) / 9;
  const carbsG = Math.max(0, (target - 4 * proteinG - 9 * fatG) / 4);
  return { proteinG, fatG, carbsG };
}

/** Peso de referencia: la tendencia si existe; si no, el último peso. */
export function referenceWeight(trendKg: number | null, lastKg: number): number {
  return trendKg ?? lastKg;
}

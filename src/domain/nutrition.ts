/** TRD §7.4 y §7.5. `null` significa desconocido y nunca cuenta como 0. */
export const NUTRIENT_KEYS = [
  'energy_kcal',
  'protein_g',
  'carbs_g',
  'sugars_g',
  'fat_g',
  'saturated_fat_g',
  'fiber_g',
  'salt_g',
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type Nutrients = Record<NutrientKey, number | null>;
export type BaseUnit = 'g' | 'ml';

export function emptyNutrients(): Nutrients {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, null])) as Nutrients;
}

/** Cantidad en la base_unit a partir de porciones. */
export function quantityFromPortions(count: number, portionAmount: number): number {
  return count * portionAmount;
}

/** valor = cantidad · valor_100 / 100, con null propagado. Sirve igual para g y ml. */
export function entryNutrients(quantity: number, per100: Nutrients): Nutrients {
  const out = emptyNutrients();
  for (const k of NUTRIENT_KEYS) {
    const v = per100[k];
    out[k] = v == null ? null : (quantity * v) / 100;
  }
  return out;
}

export interface Snapshot {
  per100: Nutrients;
  nutrients: Nutrients;
}

/** Snapshot M16: copia de los valores por 100 usados y de los calculados. */
export function snapshot(quantity: number, per100: Nutrients): Snapshot {
  return { per100: { ...per100 }, nutrients: entryNutrients(quantity, per100) };
}

export interface Totals {
  totals: Record<NutrientKey, number>;
  partial: Record<NutrientKey, boolean>;
  isPartial: boolean;
}

/** Suma de los valores no null; un nutriente es parcial si algún registro lo tiene a null. */
export function sumNutrients(entries: ReadonlyArray<Nutrients>): Totals {
  const totals = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0])) as Record<NutrientKey, number>;
  const partial = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, false])) as Record<
    NutrientKey,
    boolean
  >;
  for (const e of entries) {
    for (const k of NUTRIENT_KEYS) {
      const v = e[k];
      if (v == null) partial[k] = true;
      else totals[k] += v;
    }
  }
  return { totals, partial, isPartial: NUTRIENT_KEYS.some((k) => partial[k]) };
}

export interface RecipeIngredient {
  quantity: number;
  unit: BaseUnit;
  per100: Nutrients;
}

export interface RecipeResult {
  per100: Nutrients;
  totalWeight: number;
  servingAmount: number | null;
  needsReview: boolean;
}

/** TRD §7.5. Mezclar g y ml (sin densidad) trata 1 ml como 1 g y marca needs_review. */
export function recipeNutrients(
  ingredients: ReadonlyArray<RecipeIngredient>,
  cookedWeight?: number | null,
  servings?: number | null,
): RecipeResult {
  if (ingredients.length === 0) throw new Error('La receta no tiene ingredientes');
  const units = new Set(ingredients.map((i) => i.unit));
  const raw = ingredients.reduce((s, i) => s + i.quantity, 0);
  const totalWeight = cookedWeight && cookedWeight > 0 ? cookedWeight : raw;
  const per100 = emptyNutrients();
  for (const k of NUTRIENT_KEYS) {
    let sum = 0;
    let unknown = false;
    for (const i of ingredients) {
      const v = i.per100[k];
      if (v == null) unknown = true;
      else sum += (i.quantity * v) / 100;
    }
    per100[k] = unknown ? null : (sum / totalWeight) * 100;
  }
  return {
    per100,
    totalWeight,
    servingAmount: servings && servings > 0 ? totalWeight / servings : null,
    needsReview: units.size > 1,
  };
}

/** Comprobación de coherencia: |kcal − (4P + 4C + 9G)| / kcal > 0.20 (Backend Schema §7). */
export function isKcalIncoherent(n: Nutrients, tolerance = 0.2): boolean {
  const { energy_kcal: kcal, protein_g: p, carbs_g: c, fat_g: f } = n;
  if (kcal == null || p == null || c == null || f == null) return false;
  const est = 4 * p + 4 * c + 9 * f;
  if (kcal === 0) return est > 5;
  return Math.abs(kcal - est) / kcal > tolerance;
}

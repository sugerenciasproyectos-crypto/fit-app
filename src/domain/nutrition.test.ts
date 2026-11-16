import { describe, expect, it } from 'vitest';
import {
  emptyNutrients,
  entryNutrients,
  isKcalIncoherent,
  quantityFromPortions,
  recipeNutrients,
  snapshot,
  sumNutrients,
  type Nutrients,
} from './nutrition';

const yogur: Nutrients = {
  energy_kcal: 60,
  protein_g: 4,
  carbs_g: 5,
  sugars_g: 5,
  fat_g: 2.5,
  saturated_fat_g: 1.6,
  fiber_g: null,
  salt_g: 0.1,
};

describe('registro', () => {
  it('escala por 100 y propaga null', () => {
    const n = entryNutrients(125, yogur);
    expect(n.energy_kcal).toBe(75);
    expect(n.protein_g).toBe(5);
    expect(n.fiber_g).toBeNull();
  });
  it('porciones: n · amount; funciona igual en ml', () => {
    expect(quantityFromPortions(2, 15)).toBe(30);
    const leche = { ...yogur, fiber_g: 0 };
    expect(entryNutrients(quantityFromPortions(1.5, 200), leche).energy_kcal).toBe(180);
  });
  it('snapshot copia per100 sin compartir referencia', () => {
    const per = { ...yogur };
    const s = snapshot(100, per);
    per.energy_kcal = 999;
    expect(s.per100.energy_kcal).toBe(60);
    expect(s.nutrients.energy_kcal).toBe(60);
  });
});

describe('totales del día', () => {
  it('null no cuenta como 0 y marca parcial', () => {
    const a = entryNutrients(100, yogur);
    const b = entryNutrients(100, { ...yogur, fiber_g: 3 });
    const t = sumNutrients([a, b]);
    expect(t.totals.energy_kcal).toBe(120);
    expect(t.totals.fiber_g).toBe(3);
    expect(t.partial.fiber_g).toBe(true);
    expect(t.partial.energy_kcal).toBe(false);
    expect(t.isPartial).toBe(true);
  });
  it('día vacío: ceros y no parcial', () => {
    const t = sumNutrients([]);
    expect(t.totals.energy_kcal).toBe(0);
    expect(t.isPartial).toBe(false);
  });
});

describe('recetas', () => {
  const arroz: Nutrients = { ...emptyNutrients(), energy_kcal: 360, protein_g: 7 };
  const aceite: Nutrients = { ...emptyNutrients(), energy_kcal: 900, protein_g: 0 };
  it('per100 sobre el peso cocinado y ración', () => {
    const r = recipeNutrients(
      [
        { quantity: 200, unit: 'g', per100: arroz },
        { quantity: 10, unit: 'g', per100: aceite },
      ],
      500,
      2,
    );
    expect(r.per100.energy_kcal).toBeCloseTo(((720 + 90) / 500) * 100, 6);
    expect(r.per100.fat_g).toBeNull();
    expect(r.totalWeight).toBe(500);
    expect(r.servingAmount).toBe(250);
    expect(r.needsReview).toBe(false);
  });
  it('sin peso cocinado usa la suma; mezclar g y ml marca revisión', () => {
    const r = recipeNutrients([
      { quantity: 200, unit: 'g', per100: arroz },
      { quantity: 10, unit: 'ml', per100: aceite },
    ]);
    expect(r.totalWeight).toBe(210);
    expect(r.servingAmount).toBeNull();
    expect(r.needsReview).toBe(true);
  });
  it('sin ingredientes lanza error', () => {
    expect(() => recipeNutrients([])).toThrow();
  });
});

describe('coherencia de kcal', () => {
  const zero = { ...emptyNutrients(), energy_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  it('detecta incoherencias > 20 %', () => {
    expect(isKcalIncoherent(yogur)).toBe(false);
    expect(isKcalIncoherent({ ...yogur, energy_kcal: 200 })).toBe(true);
    expect(isKcalIncoherent({ ...yogur, fat_g: null })).toBe(false);
    expect(isKcalIncoherent(zero)).toBe(false);
    expect(isKcalIncoherent({ ...zero, protein_g: 10 })).toBe(true);
  });
});

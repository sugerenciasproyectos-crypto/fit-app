import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_FACTOR,
  bmr,
  bmrKatch,
  bmrMifflin,
  isValidAdjust,
  macros,
  referenceWeight,
  targetKcal,
  tdeeInitial,
} from './energy';

describe('TMB', () => {
  it('Mifflin hombre y mujer', () => {
    expect(bmrMifflin('male', 80, 180, 30)).toBe(1780);
    expect(bmrMifflin('female', 60, 165, 30)).toBeCloseTo(1320.25, 6);
  });
  it('Katch-McArdle', () => {
    expect(bmrKatch(80, 20)).toBeCloseTo(370 + 21.6 * 64, 6);
  });
  it('elige Katch solo si está activado y hay % de grasa', () => {
    const base = { sex: 'male' as const, weightKg: 80, heightCm: 180, age: 30 };
    expect(bmr(base)).toBe(1780);
    expect(bmr({ ...base, useKatch: true, bodyFatPct: 20 })).toBeCloseTo(1752.4, 6);
    expect(bmr({ ...base, useKatch: true, bodyFatPct: null })).toBe(1780);
    expect(bmr({ ...base, useKatch: false, bodyFatPct: 20 })).toBe(1780);
  });
});

describe('TDEE y objetivo', () => {
  it('aplica el factor de actividad', () => {
    expect(tdeeInitial(1780, 'moderate')).toBeCloseTo(2759, 6);
    expect(Object.values(ACTIVITY_FACTOR)).toEqual([1.2, 1.375, 1.55, 1.725, 1.9]);
  });
  it('objetivo con suelo de 1500/1200', () => {
    expect(targetKcal(2759, -400, 'male')).toBe(2359);
    expect(targetKcal(1800, -400, 'male')).toBe(1500);
    expect(targetKcal(1500, -400, 'female')).toBe(1200);
    expect(targetKcal(1700, -400, 'female')).toBe(1300);
  });
  it('rangos de ajuste por objetivo', () => {
    expect(isValidAdjust('lose', -400)).toBe(true);
    expect(isValidAdjust('lose', -200)).toBe(false);
    expect(isValidAdjust('lose', -600)).toBe(false);
    expect(isValidAdjust('maintain', 0)).toBe(true);
    expect(isValidAdjust('maintain', 10)).toBe(false);
    expect(isValidAdjust('gain', 250)).toBe(true);
  });
});

describe('macros', () => {
  it('reparto por defecto', () => {
    const m = macros(2359, 80);
    expect(m.proteinG).toBeCloseTo(144, 6);
    expect(m.fatG).toBeCloseTo((2359 * 0.27) / 9, 6);
    expect(m.carbsG).toBeCloseTo((2359 - 576 - 2359 * 0.27) / 4, 6);
  });
  it('los carbohidratos nunca son negativos', () => {
    expect(macros(1200, 150, 2.0, 0.3).carbsG).toBe(0);
  });
  it('peso de referencia: tendencia o último peso', () => {
    expect(referenceWeight(79.4, 80)).toBe(79.4);
    expect(referenceWeight(null, 80)).toBe(80);
  });
});

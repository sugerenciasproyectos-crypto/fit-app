import { describe, expect, it } from 'vitest';
import { addDays, type Day } from './dates';
import {
  evaluatePending,
  evaluateWeek,
  pendingWeeks,
  startupMet,
  type AdaptiveData,
  type Proposal,
} from './adaptive';
import { computeTrend } from './trend';

const params = { tdee: 2500, adjust: -400, sex: 'male' as const };
const START = '2026-10-05'; // lunes

/** Genera datos sintéticos: `days` días desde START con kcal fijas y pesos que bajan `kgPerDay`. */
function synth(opts: {
  days: number;
  kcal?: number;
  kgPerDay?: number;
  skip?: (day: Day, i: number) => boolean;
  noWeigh?: (day: Day, i: number) => boolean;
  incomplete?: Day[];
}): AdaptiveData {
  const dayKcal = new Map<Day, number>();
  const weights: { day: Day; kg: number }[] = [];
  for (let i = 0; i < opts.days; i++) {
    const day = addDays(START, i);
    if (!opts.skip?.(day, i)) dayKcal.set(day, opts.kcal ?? 2100);
    if (!opts.noWeigh?.(day, i)) weights.push({ day, kg: 85 - i * (opts.kgPerDay ?? 0.05) });
  }
  return {
    dayKcal,
    incomplete: new Set(opts.incomplete ?? []),
    weighIns: weights.map((w) => w.day),
    trend: computeTrend(weights),
  };
}

describe('arranque', () => {
  it('no se cumple con menos de 14 días', () => {
    const d = synth({ days: 13 });
    expect(startupMet(d, addDays(START, 12))).toBe(false);
    expect(evaluateWeek(START, d, params)).toMatchObject({
      status: 'skipped',
      skipReason: 'arranque',
    });
  });
  it('no se cumple sin 10 días registrados o sin 7 pesajes', () => {
    const until = addDays(START, 20);
    expect(startupMet(synth({ days: 21, skip: (_, i) => i % 3 !== 0 }), until)).toBe(false);
    expect(startupMet(synth({ days: 21, noWeigh: (_, i) => i % 4 !== 0 }), until)).toBe(false);
    expect(startupMet(synth({ days: 21 }), until)).toBe(true);
  });
  it('sin ningún registro', () => {
    const d: AdaptiveData = { dayKcal: new Map(), incomplete: new Set(), weighIns: [], trend: [] };
    expect(startupMet(d, START)).toBe(false);
  });
});

describe('semana evaluada', () => {
  const week3 = addDays(START, 14);
  it('menos de 5 días registrados (los incompletos no cuentan)', () => {
    const incomplete = [0, 1, 2].map((i) => addDays(week3, i));
    const d = synth({ days: 21, incomplete });
    expect(evaluateWeek(week3, d, params)).toMatchObject({
      status: 'skipped',
      skipReason: 'dias<5',
      daysLogged: 4,
    });
  });
  it('sin pesaje en la semana', () => {
    const d = synth({ days: 21, noWeigh: (_, i) => i >= 14 });
    expect(evaluateWeek(week3, d, params)).toMatchObject({ skipReason: 'sin pesaje' });
  });
  it('propuesta sin límite', () => {
    const d = synth({ days: 21, kcal: 2400, kgPerDay: 0.02 });
    const r = evaluateWeek(week3, d, params) as Proposal;
    expect(r.status).toBe('pending');
    expect(r.daysLogged).toBe(7);
    expect(r.kcalAvg).toBe(2400);
    const obs = 2400 - (r.trendDeltaKg * 7700) / 7;
    expect(r.tdeeObs).toBeCloseTo(obs, 8);
    expect(r.tdeeProposed).toBeCloseTo(0.8 * 2500 + 0.2 * obs, 8);
    expect(r.clamped).toBe(false);
    expect(r.targetKcalProposed).toBeCloseTo(r.tdeeProposed - 400, 8);
  });
  it('ajuste limitado a ±150', () => {
    const up = evaluateWeek(
      week3,
      synth({ days: 21, kcal: 4000, kgPerDay: 0 }),
      params,
    ) as Proposal;
    expect(up.tdeeProposed).toBe(2650);
    expect(up.clamped).toBe(true);
    const down = evaluateWeek(
      week3,
      synth({ days: 21, kcal: 1000, kgPerDay: 0 }),
      params,
    ) as Proposal;
    expect(down.tdeeProposed).toBe(2350);
  });
  it('el objetivo propuesto respeta el suelo', () => {
    const d = synth({ days: 21, kcal: 1000, kgPerDay: 0 });
    const r = evaluateWeek(week3, d, { tdee: 1700, adjust: -500, sex: 'male' }) as Proposal;
    expect(r.targetKcalProposed).toBe(1500);
  });
  it('rechaza una semana que no empieza en lunes', () => {
    expect(() => evaluateWeek('2026-10-06', synth({ days: 1 }), params)).toThrow();
  });
});

describe('semanas pendientes', () => {
  it('lista solo semanas completas', () => {
    expect(pendingWeeks(null, '2026-10-07', '2026-10-19')).toEqual(['2026-10-05', '2026-10-12']);
    expect(pendingWeeks('2026-10-05', '2026-10-07', '2026-10-18')).toEqual([]);
    expect(pendingWeeks('2026-10-05', '2026-10-07', '2026-10-26')).toEqual([
      '2026-10-12',
      '2026-10-19',
    ]);
  });
  it('varias semanas pendientes: solo la última queda pendiente', () => {
    const d = synth({ days: 42, kcal: 2400, kgPerDay: 0.03 });
    const weeks = pendingWeeks(null, START, addDays(START, 42));
    const r = evaluatePending(weeks, d, params);
    expect(r.map((x) => x.status)).toEqual([
      'skipped',
      'expired',
      'expired',
      'expired',
      'expired',
      'pending',
    ]);
    expect(r.filter((x) => x.status === 'pending')).toHaveLength(1);
  });
});

import { describe, expect, it } from 'vitest';
import { computeTrend, recomputeFrom, trendAt, weeklyRate } from './trend';

// Valores de referencia calculados en una hoja de cálculo: T_i = T_{i-1} + 0.1·(w_i − T_{i-1}).
const weights = [
  { day: '2026-11-05', kg: 78.5 },
  { day: '2026-11-01', kg: 80 },
  { day: '2026-11-03', kg: 79 }, // hueco el día 2 y el 4
];

describe('EMA', () => {
  it('ordena, empieza en el primer peso y no rellena huecos', () => {
    const t = computeTrend(weights);
    expect(t.map((p) => p.day)).toEqual(['2026-11-01', '2026-11-03', '2026-11-05']);
    expect(t[0]!.trend).toBe(80);
    expect(t[1]!.trend).toBeCloseTo(79.9, 10);
    expect(t[2]!.trend).toBeCloseTo(79.76, 10);
  });
  it('serie vacía', () => {
    expect(computeTrend([])).toEqual([]);
  });
  it('recalcular desde una fecha equivale a recalcular todo', () => {
    const t = computeTrend(weights);
    const withPast = [...weights, { day: '2026-11-02', kg: 81 }];
    expect(recomputeFrom(t, withPast, '2026-11-02')).toEqual(computeTrend(withPast));
    expect(recomputeFrom(t, withPast, '2026-10-01')).toEqual(computeTrend(withPast));
  });
  it('tendencia vigente en un día', () => {
    const t = computeTrend(weights);
    expect(trendAt(t, '2026-10-31')).toBeNull();
    expect(trendAt(t, '2026-11-04')).toBeCloseTo(79.9, 10);
    expect(trendAt(t, '2026-12-01')).toBeCloseTo(79.76, 10);
  });
});

describe('ritmo semanal', () => {
  const daily = Array.from({ length: 15 }, (_, i) => ({
    day: `2026-11-${String(i + 1).padStart(2, '0')}`,
    kg: 80 - i * 0.1,
  }));
  const t = computeTrend(daily);
  it('null con menos de 7 días de tendencia o sin datos', () => {
    expect(weeklyRate([], '2026-11-10')).toBeNull();
    expect(weeklyRate(t, '2026-11-07')).toBeNull();
  });
  it('T(hoy) − T(hoy − 7)', () => {
    const r = weeklyRate(t, '2026-11-15');
    expect(r).toBeCloseTo(trendAt(t, '2026-11-15')! - trendAt(t, '2026-11-08')!, 10);
    expect(r!).toBeLessThan(0);
  });
});

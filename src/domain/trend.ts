/** TRD §7.6 (EMA α = 0.1) y §7.8 (ritmo semanal). */
import { addDays, diffDays, type Day } from './dates';

export const ALPHA = 0.1;

export interface WeightPoint {
  day: Day;
  kg: number;
}
export interface TrendPoint extends WeightPoint {
  trend: number;
}

function sorted(weights: ReadonlyArray<WeightPoint>): WeightPoint[] {
  return [...weights].sort((a, b) => a.day.localeCompare(b.day));
}

/** Los días sin peso no actualizan la tendencia (no se interpolan). */
export function computeTrend(weights: ReadonlyArray<WeightPoint>, alpha = ALPHA): TrendPoint[] {
  const out: TrendPoint[] = [];
  let prev: number | null = null;
  for (const w of sorted(weights)) {
    const t: number = prev === null ? w.kg : prev + alpha * (w.kg - prev);
    out.push({ day: w.day, kg: w.kg, trend: t });
    prev = t;
  }
  return out;
}

/**
 * Recalcula desde `fromDay` (p. ej. al importar un peso pasado): conserva los puntos anteriores
 * y rehace el resto con la serie completa de pesos. Equivale a computeTrend(weights).
 */
export function recomputeFrom(
  existing: ReadonlyArray<TrendPoint>,
  weights: ReadonlyArray<WeightPoint>,
  fromDay: Day,
  alpha = ALPHA,
): TrendPoint[] {
  const kept = existing.filter((p) => p.day < fromDay);
  const rest = sorted(weights).filter((w) => w.day >= fromDay);
  const out = [...kept];
  let prev = kept.length ? kept[kept.length - 1]!.trend : null;
  for (const w of rest) {
    const t: number = prev === null ? w.kg : prev + alpha * (w.kg - prev);
    out.push({ day: w.day, kg: w.kg, trend: t });
    prev = t;
  }
  return out;
}

/** Tendencia vigente en `day`: la del último pesaje en o antes de ese día. */
export function trendAt(points: ReadonlyArray<TrendPoint>, day: Day): number | null {
  let v: number | null = null;
  for (const p of points) {
    if (p.day > day) break;
    v = p.trend;
  }
  return v;
}

/** ritmo = T(hoy) − T(hoy − 7). Solo con 7 días de tendencia o más; si no, null. */
export function weeklyRate(points: ReadonlyArray<TrendPoint>, today: Day): number | null {
  const first = points[0];
  if (!first || diffDays(today, first.day) < 7) return null;
  // Con el primer pesaje 7 o más días antes de hoy, las dos tendencias existen.
  return trendAt(points, today)! - trendAt(points, addDays(today, -7))!;
}

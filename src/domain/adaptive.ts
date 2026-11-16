/** TRD §7.7. Semanas de lunes a domingo (días locales Europe/Madrid). */
import { addDays, diffDays, isoDow, mondayOf, type Day } from './dates';
import { targetKcal, type Sex } from './energy';
import { trendAt, type TrendPoint } from './trend';

export const KCAL_PER_KG = 7700;
export const MAX_STEP = 150;
export const STARTUP = { days: 14, loggedDays: 10, weighIns: 7 } as const;
export const MIN_DAYS_PER_WEEK = 5;

export type SkipReason = 'arranque' | 'dias<5' | 'sin pesaje';

export interface AdaptiveData {
  /** kcal del día para cada día con al menos un registro. */
  dayKcal: ReadonlyMap<Day, number>;
  /** Días marcados como incompletos. */
  incomplete: ReadonlySet<Day>;
  /** Días con pesaje. */
  weighIns: ReadonlyArray<Day>;
  trend: ReadonlyArray<TrendPoint>;
}

export interface AdaptiveParams {
  tdee: number;
  adjust: number;
  sex: Sex;
}

interface Base {
  weekStart: Day;
  tdeeBefore: number;
  daysLogged: number;
}
export interface Skipped extends Base {
  status: 'skipped';
  skipReason: SkipReason;
}
export interface Proposal extends Base {
  status: 'pending' | 'expired';
  kcalAvg: number;
  trendStartKg: number;
  trendEndKg: number;
  trendDeltaKg: number;
  tdeeObs: number;
  tdeeProposed: number;
  clamped: boolean;
  targetKcalProposed: number;
}
export type WeekResult = Skipped | Proposal;

function loggedDaysUpTo(d: AdaptiveData, until: Day): Day[] {
  return [...d.dayKcal.keys()].filter((day) => day <= until && !d.incomplete.has(day)).sort();
}

export function startupMet(d: AdaptiveData, until: Day): boolean {
  const logged = loggedDaysUpTo(d, until);
  const first = [...d.dayKcal.keys()].sort()[0];
  if (!first) return false;
  const span = diffDays(until, first) + 1;
  const weighIns = d.weighIns.filter((w) => w <= until).length;
  return (
    span >= STARTUP.days && logged.length >= STARTUP.loggedDays && weighIns >= STARTUP.weighIns
  );
}

export function evaluateWeek(weekStart: Day, d: AdaptiveData, p: AdaptiveParams): WeekResult {
  if (isoDow(weekStart) !== 1) throw new Error(`La semana debe empezar en lunes: ${weekStart}`);
  const sunday = addDays(weekStart, 6);
  const inWeek = (day: Day) => day >= weekStart && day <= sunday;
  const days = loggedDaysUpTo(d, sunday).filter(inWeek);
  const base: Base = { weekStart, tdeeBefore: p.tdee, daysLogged: days.length };

  if (!startupMet(d, sunday)) return { ...base, status: 'skipped', skipReason: 'arranque' };
  if (days.length < MIN_DAYS_PER_WEEK) return { ...base, status: 'skipped', skipReason: 'dias<5' };
  const tEnd = trendAt(d.trend, sunday);
  const tStart = trendAt(d.trend, addDays(weekStart, -1));
  if (!d.weighIns.some(inWeek) || tEnd === null || tStart === null) {
    return { ...base, status: 'skipped', skipReason: 'sin pesaje' };
  }

  const kcalAvg = days.reduce((s, day) => s + d.dayKcal.get(day)!, 0) / days.length;
  const delta = tEnd - tStart;
  const tdeeObs = kcalAvg - (delta * KCAL_PER_KG) / 7;
  const blended = 0.8 * p.tdee + 0.2 * tdeeObs;
  const tdeeProposed = Math.min(p.tdee + MAX_STEP, Math.max(p.tdee - MAX_STEP, blended));
  return {
    ...base,
    status: 'pending',
    kcalAvg,
    trendStartKg: tStart,
    trendEndKg: tEnd,
    trendDeltaKg: delta,
    tdeeObs,
    tdeeProposed,
    clamped: tdeeProposed !== blended,
    targetKcalProposed: targetKcal(tdeeProposed, p.adjust, p.sex),
  };
}

/** Semanas completas (domingo < hoy) aún sin evaluar, desde la siguiente a `lastEvaluated`. */
export function pendingWeeks(lastEvaluated: Day | null, firstDay: Day, today: Day): Day[] {
  const start = lastEvaluated ? addDays(lastEvaluated, 7) : mondayOf(firstDay);
  const out: Day[] = [];
  for (let w = start; addDays(w, 6) < today; w = addDays(w, 7)) out.push(w);
  return out;
}

/**
 * Evalúa todas las semanas pendientes. Como ninguna se ha aceptado, el TDEE no cambia entre ellas.
 * Solo la última propuesta queda 'pending'; las anteriores se marcan 'expired'.
 */
export function evaluatePending(
  weeks: ReadonlyArray<Day>,
  d: AdaptiveData,
  p: AdaptiveParams,
): WeekResult[] {
  const results = weeks.map((w) => evaluateWeek(w, d, p));
  let lastPending = -1;
  results.forEach((r, i) => {
    if (r.status === 'pending') lastPending = i;
  });
  return results.map((r, i) =>
    r.status === 'pending' && i !== lastPending ? { ...r, status: 'expired' } : r,
  );
}

/** Fechas de día como cadenas ISO 'YYYY-MM-DD'. Aritmética en UTC para evitar saltos de horario de verano. */
export type Day = string;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MS_DAY = 86_400_000;

function toUtc(day: Day): number {
  if (!DAY_RE.test(day)) throw new Error(`Día no válido: ${day}`);
  const ms = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(ms)) throw new Error(`Día no válido: ${day}`);
  return ms;
}

export function addDays(day: Day, n: number): Day {
  return new Date(toUtc(day) + n * MS_DAY).toISOString().slice(0, 10);
}

export function diffDays(a: Day, b: Day): number {
  return Math.round((toUtc(a) - toUtc(b)) / MS_DAY);
}

/** 1 = lunes … 7 = domingo. */
export function isoDow(day: Day): number {
  const d = new Date(toUtc(day)).getUTCDay();
  return d === 0 ? 7 : d;
}

export function mondayOf(day: Day): Day {
  return addDays(day, 1 - isoDow(day));
}

/** Día local en Europe/Madrid de un instante. */
export function madridDay(instant: Date, timeZone = 'Europe/Madrid'): Day {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Edad en años cumplidos en `today`. */
export function ageOn(birthDate: Day, today: Day): number {
  toUtc(birthDate);
  toUtc(today);
  const [by, bm, bd] = birthDate.split('-').map(Number) as [number, number, number];
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number];
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

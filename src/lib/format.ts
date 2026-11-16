/** Formato español: 1.284 · 78,4. kcal enteras y gramos con 1 decimal (TRD §7). */
const int = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });
const one = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  useGrouping: 'always',
});
const upTo2 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2, useGrouping: 'always' });

export const fmtKcal = (v: number) => int.format(Math.round(v));
export const fmtG = (v: number) => one.format(v);
export const fmtKg = (v: number) => one.format(v);
export const fmtQty = (v: number) => upTo2.format(v);

/** Acepta coma o punto decimal. Devuelve null si no es un número. */
export function parseDecimal(s: string): number | null {
  const t = s.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

const DOW = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MON = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/** '2026-11-16' → 'LUN 16 NOV 2026' */
export function fmtTicketDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

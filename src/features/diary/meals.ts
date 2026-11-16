/** Selección de comida por hora (H1): la franja con mayor start_time ≤ ahora. */
export interface SlotLike {
  id: string;
  start_time: string | null; // 'HH:MM[:SS]'
  position: number;
  archived: boolean;
}

export function slotForTime<T extends SlotLike>(slots: readonly T[], hhmm: string): T | null {
  const active = slots.filter((s) => !s.archived && s.start_time !== null);
  const sorted = [...active].sort((a, b) => a.start_time!.localeCompare(b.start_time!));
  let pick: T | null = null;
  for (const s of sorted) if (s.start_time!.slice(0, 5) <= hhmm) pick = s;
  return pick ?? sorted[0] ?? slots[0] ?? null;
}

/** Hora local HH:MM en Europe/Madrid. */
export function madridTime(d: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

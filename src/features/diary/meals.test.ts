import { describe, expect, it } from 'vitest';
import { madridTime, slotForTime } from './meals';

const slots = [
  { id: 'd', start_time: '00:00:00', position: 1, archived: false },
  { id: 'c', start_time: '11:00:00', position: 2, archived: false },
  { id: 'm', start_time: '16:00:00', position: 3, archived: false },
  { id: 'x', start_time: '19:30:00', position: 4, archived: false },
  { id: 's', start_time: null, position: 5, archived: false },
];

describe('comida por hora', () => {
  it('a las 14:00 propone Comida', () => {
    expect(slotForTime(slots, '14:00')?.id).toBe('c');
    expect(slotForTime(slots, '08:15')?.id).toBe('d');
    expect(slotForTime(slots, '19:30')?.id).toBe('x');
    expect(slotForTime(slots, '23:59')?.id).toBe('x');
  });
  it('ignora archivadas y franjas sin hora', () => {
    const s = slots.map((x) => (x.id === 'c' ? { ...x, archived: true } : x));
    expect(slotForTime(s, '14:00')?.id).toBe('d');
    expect(slotForTime([slots[4]!], '14:00')?.id).toBe('s');
    expect(slotForTime([], '14:00')).toBeNull();
  });
  it('hora local en Madrid', () => {
    expect(madridTime(new Date('2026-11-16T13:00:00Z'))).toBe('14:00');
  });
});

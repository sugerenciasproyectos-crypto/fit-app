import { describe, expect, it } from 'vitest';
import { addDays, ageOn, diffDays, isoDow, madridDay, mondayOf } from './dates';

describe('dates', () => {
  it('suma días cruzando meses, años y el cambio de hora', () => {
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('diferencia de días', () => {
    expect(diffDays('2026-11-16', '2026-11-02')).toBe(14);
  });
  it('día de la semana ISO y lunes de la semana', () => {
    expect(isoDow('2026-11-16')).toBe(1);
    expect(isoDow('2026-11-22')).toBe(7);
    expect(mondayOf('2026-11-22')).toBe('2026-11-16');
    expect(mondayOf('2026-11-16')).toBe('2026-11-16');
  });
  it('día local en Madrid', () => {
    expect(madridDay(new Date('2026-11-16T23:30:00Z'))).toBe('2026-11-17');
    expect(madridDay(new Date('2026-07-01T21:59:00Z'))).toBe('2026-07-01');
  });
  it('edad en años cumplidos', () => {
    expect(ageOn('2000-11-17', '2026-11-16')).toBe(25);
    expect(ageOn('2000-11-16', '2026-11-16')).toBe(26);
    expect(ageOn('2000-12-01', '2026-11-30')).toBe(25);
  });
  it('rechaza días mal formados', () => {
    expect(() => addDays('16/11/2026', 1)).toThrow();
    expect(() => addDays('2026-13-45', 1)).toThrow();
  });
});

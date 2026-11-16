import { describe, expect, it } from 'vitest';
import { fmtG, fmtKcal, fmtKg, fmtQty, fmtTicketDay, parseDecimal } from './format';

describe('formato es-ES', () => {
  it('números', () => {
    expect(fmtKcal(1284.4)).toBe('1.284');
    expect(fmtG(98)).toBe('98,0');
    expect(fmtKg(78.44)).toBe('78,4');
    expect(fmtQty(0.5)).toBe('0,5');
  });
  it('coma decimal', () => {
    expect(parseDecimal('78,4')).toBe(78.4);
    expect(parseDecimal(' 60 ')).toBe(60);
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('')).toBeNull();
  });
  it('cabecera de ticket', () => {
    expect(fmtTicketDay('2026-11-16')).toBe('LUN 16 NOV 2026');
  });
});

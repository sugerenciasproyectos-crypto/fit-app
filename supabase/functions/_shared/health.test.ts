import { describe, expect, it } from 'vitest';
import {
  dailyMaxAcrossSources,
  earliestWeightPerDay,
  madridDay,
  shouldReplaceWeight,
  validateSamples,
} from './health';

describe('health-sync: validación', () => {
  it('normaliza, calcula el día de Madrid y el external_id estable', async () => {
    const s = {
      type: 'weight',
      value: '78,4',
      unit: 'kg',
      start: '2026-11-16T23:30:00Z',
      source: 'Nothing X',
    };
    const a = await validateSamples([s]);
    const b = await validateSamples([s]);
    expect(a.errors).toEqual([]);
    expect(a.ok[0]).toMatchObject({ value: 78.4, day: '2026-11-17' });
    expect(a.ok[0]!.external_id).toBe(b.ok[0]!.external_id);
    expect(a.ok[0]!.external_id).toMatch(/^[0-9a-f]{64}$/);
  });
  it('rechaza tipos, valores, fechas y pesos fuera de rango', async () => {
    const r = await validateSamples([
      { type: 'heart', value: 1, start: '2026-11-16T07:00:00Z' },
      { type: 'steps', value: -1, start: '2026-11-16T07:00:00Z' },
      { type: 'steps', value: 10, start: 'ayer' },
      { type: 'weight', value: 12, start: '2026-11-16T07:00:00Z' },
    ]);
    expect(r.ok).toEqual([]);
    expect(r.errors).toHaveLength(4);
    expect((await validateSamples('x')).errors).toEqual(['samples debe ser una lista']);
  });
});

describe('health-sync: reglas', () => {
  it('peso del día: la muestra más temprana', async () => {
    const { ok } = await validateSamples([
      { type: 'weight', value: 79, start: '2026-11-16T20:00:00+01:00' },
      { type: 'weight', value: 78.4, start: '2026-11-16T07:42:00+01:00' },
      { type: 'weight', value: 78, start: '2026-11-17T07:00:00+01:00' },
    ]);
    const m = earliestWeightPerDay(ok);
    expect(m.get('2026-11-16')!.value).toBe(78.4);
    expect(m.get('2026-11-17')!.value).toBe(78);
  });
  it('pasos: suma por fuente y máximo entre fuentes', () => {
    const m = dailyMaxAcrossSources(
      [
        { type: 'steps', day: '2026-11-16', source: 'Reloj', value: 6000 },
        { type: 'steps', day: '2026-11-16', source: 'Reloj', value: 3000 },
        { type: 'steps', day: '2026-11-16', source: 'iPhone', value: 7000 },
        { type: 'active_kcal', day: '2026-11-16', source: 'Reloj', value: 400 },
      ],
      'steps',
    );
    expect(m.get('2026-11-16')).toBe(9000);
  });
  it('el peso manual manda; si no, la más temprana', () => {
    expect(shouldReplaceWeight(null, '2026-11-16T07:00:00Z')).toBe(true);
    expect(
      shouldReplaceWeight(
        { source: 'manual', measured_at: '2026-11-16T09:00:00Z' },
        '2026-11-16T07:00:00Z',
      ),
    ).toBe(false);
    expect(
      shouldReplaceWeight(
        { source: 'health', measured_at: '2026-11-16T09:00:00Z' },
        '2026-11-16T07:00:00Z',
      ),
    ).toBe(true);
    expect(
      shouldReplaceWeight(
        { source: 'health', measured_at: '2026-11-16T06:00:00Z' },
        '2026-11-16T07:00:00Z',
      ),
    ).toBe(false);
  });
  it('día de Madrid en verano e invierno', () => {
    expect(madridDay('2026-07-01T22:30:00Z')).toBe('2026-07-02');
    expect(madridDay('2026-01-01T22:30:00Z')).toBe('2026-01-01');
  });
});

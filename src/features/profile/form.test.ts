import { describe, expect, it } from 'vitest';
import { emptyDraft, toInput, validateBody, validateGoal, type ProfileDraft } from './form';
import { computeTargets } from './targets';

const ok: ProfileDraft = {
  ...emptyDraft,
  sex: 'male',
  birth_date: '1996-11-16',
  height_cm: '180',
  weight_kg: '80',
};
const today = '2026-11-16';

describe('formulario de perfil', () => {
  it('válido', () => {
    expect(validateBody(ok, today)).toEqual({});
    expect(validateGoal(ok)).toEqual({});
    expect(toInput(ok, today)).toMatchObject({ fat_pct: 0.27, protein_g_per_kg: 1.8 });
  });
  it('límites del cuerpo', () => {
    const e = validateBody(
      { ...emptyDraft, birth_date: '2020-01-01', height_cm: '100', weight_kg: '20' },
      today,
    );
    expect(Object.keys(e).sort()).toEqual(['birth_date', 'height_cm', 'sex', 'weight_kg']);
    expect(validateBody({ ...ok, birth_date: 'x' }, today).birth_date).toBe('Fecha no válida');
  });
  it('ajuste según objetivo y Katch sin % de grasa', () => {
    expect(validateGoal({ ...ok, goal: 'maintain', kcal_adjust: '-400' }).kcal_adjust).toBe(
      'Debe ser 0',
    );
    expect(validateGoal({ ...ok, goal: 'gain', kcal_adjust: '100' }).kcal_adjust).toBeDefined();
    expect(validateGoal({ ...ok, use_katch: true }).body_fat_pct).toBeDefined();
    expect(validateGoal({ ...ok, body_fat_pct: '80' }).body_fat_pct).toBeDefined();
    expect(toInput({ ...ok, height_cm: '' }, today)).toBeNull();
  });
  it('vista en vivo de objetivos', () => {
    const t = computeTargets(toInput(ok, today)!, 80, today);
    expect(t.bmr).toBe(1780);
    expect(t.tdee0).toBeCloseTo(2759, 6);
    expect(t.kcal).toBeCloseTo(2359, 6);
    const katch = computeTargets(
      toInput({ ...ok, body_fat_pct: '20', use_katch: true }, today)!,
      80,
      today,
      2500,
    );
    expect(katch.bmr).toBeCloseTo(1752.4, 6);
    expect(katch.tdee).toBe(2500);
  });
});

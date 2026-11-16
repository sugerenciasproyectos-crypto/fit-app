import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { emptyNutrients, sumNutrients } from '../../domain/nutrition';
import { RemainingBlock } from './RemainingBlock';

const targets = {
  bmr: 1780,
  tdee0: 2759,
  tdee: 2759,
  kcal: 2000,
  proteinG: 150,
  fatG: 60,
  carbsG: 210,
};
const entry = (kcal: number, fiber: number | null = 2) => ({
  ...emptyNutrients(),
  energy_kcal: kcal,
  protein_g: 10,
  carbs_g: 20,
  fat_g: 5,
  sugars_g: 1,
  saturated_fat_g: 1,
  salt_g: 0.1,
  fiber_g: fiber,
});

afterEach(cleanup);

describe('Bloque RESTANTE', () => {
  it('estado normal', () => {
    render(<RemainingBlock targets={targets} totals={sumNutrients([entry(716)])} />);
    expect(screen.getByTestId('remaining').textContent).toContain('1.284');
    expect(screen.getByText('RESTANTE')).toBeTruthy();
    expect(screen.queryByText(/parcial/)).toBeNull();
    expect(
      screen.getByRole('progressbar', { name: 'Kilocalorías' }).getAttribute('aria-valuenow'),
    ).toBe('716');
  });
  it('estado vacío', () => {
    render(<RemainingBlock targets={targets} totals={sumNutrients([])} />);
    expect(screen.getByTestId('remaining').textContent).toContain('2.000');
  });
  it('exceso en rojo con texto y signo +', () => {
    render(<RemainingBlock targets={targets} totals={sumNutrients([entry(2120)])} />);
    const n = screen.getByTestId('remaining');
    expect(n.textContent).toContain('+120');
    expect(n.className).toContain('text-alert');
    expect(screen.getByText('EXCESO')).toBeTruthy();
  });
  it('total parcial y desplegable de micronutrientes', () => {
    render(
      <RemainingBlock targets={targets} totals={sumNutrients([entry(300), entry(200, null)])} />,
    );
    expect(screen.getByText('½ parcial')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('Fibra').nextSibling?.textContent).toContain('½');
  });
});

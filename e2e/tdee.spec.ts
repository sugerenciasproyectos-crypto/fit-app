import { expect, test } from '@playwright/test';
import { signIn } from '../tests/db/client';
import { expectAccessible, login } from './helpers';

/** E2E-6: aceptar una propuesta de TDEE cambia el objetivo; se restaura al terminar. */
test('E2E-6: aceptar propuesta', async ({ page }) => {
  const { db, id } = await signIn('A');
  const { data: prof } = await db.from('profiles').select('tdee_current').single();
  const before = prof!.tdee_current;
  await db.from('tdee_proposals').delete().eq('user_id', id).eq('week_start', '2020-01-06');
  const { error } = await db.from('tdee_proposals').insert({
    user_id: id,
    week_start: '2020-01-06',
    status: 'pending',
    days_logged: 7,
    kcal_avg: 2300,
    trend_start_kg: 82.5,
    trend_end_kg: 82.2,
    trend_delta_kg: -0.3,
    tdee_obs: 2630,
    tdee_before: before,
    tdee_proposed: before + 100,
    target_kcal_proposed: before - 300,
  });
  expect(error).toBeNull();

  try {
    await login(page);
    const card = page.getByRole('region', { name: 'Propuesta de TDEE' });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Detalle' }).click();
    await expect(page.getByText('TDEE observado')).toBeVisible();
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Cerrar' }).click();
    await card.getByRole('button', { name: 'Aceptar' }).click();
    await expect(page.getByText('Objetivo actualizado')).toBeVisible();
    await expect(card).toHaveCount(0);
    const { data } = await db.from('profiles').select('tdee_current').single();
    expect(data!.tdee_current).toBe(before + 100);
  } finally {
    await db.from('profiles').update({ tdee_current: before }).eq('user_id', id);
    await db.from('tdee_proposals').delete().eq('user_id', id).eq('week_start', '2020-01-06');
  }
});

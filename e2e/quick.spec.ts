import { expect, test } from '@playwright/test';
import { signIn } from '../tests/db/client';
import { login, resetDiary } from './helpers';

test.beforeEach(() => resetDiary());

/** E2E-3: un favorito con su última cantidad se registra en 2 toques desde Hoy. */
test('E2E-3: favorito en 2 toques', async ({ page }) => {
  const { db } = await signIn('A');
  const { data: p } = await db
    .from('products')
    .select('id')
    .eq('source_id', 'seed:platano')
    .single();
  await db
    .from('products')
    .update({
      favorite: true,
      last_quantity: 120,
      last_portion_id: null,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', p!.id);

  await login(page);
  await expect(page.getByTestId('remaining')).toBeVisible();
  // Toque 1
  await page.getByRole('button', { name: 'Añadir alimento' }).click();
  // Toque 2
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Plátano.*1 toque/ })
    .click();
  await expect(page.getByText('Añadido · Plátano')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Plátano\s*,\s*120 g\s*,\s*107 kcal/ }),
  ).toBeVisible();
});

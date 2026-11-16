import { expect, test } from '@playwright/test';
import { expectAccessible, login, resetDiary } from './helpers';

test.beforeEach(() => resetDiary());

test('E2E-1: registrar desde la búsqueda', async ({ page }) => {
  await login(page);
  await expect(page.getByTestId('remaining')).toBeVisible();
  await expectAccessible(page);
  const before = await page.getByTestId('remaining').innerText();

  await page.getByRole('button', { name: 'Añadir alimento' }).click();
  await page.getByPlaceholder('Buscar alimento o código').fill('platano');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Plátano/ })
    .first()
    .click();
  const qty = page.getByRole('dialog').getByRole('textbox').first();
  await qty.fill('120');
  await page.getByRole('button', { name: /^Añadir 107 kcal$/ }).click();

  await expect(page.getByText('Añadido · Plátano')).toBeVisible();
  await expect(page.getByTestId('remaining')).not.toHaveText(before);
  const row = page.getByRole('button', { name: /Plátano\s*,\s*120 g\s*,\s*107 kcal/ }).last();
  await expect(row).toBeVisible();

  // Limpieza: abrir el registro y eliminarlo; Deshacer está disponible.
  await row.click();
  await page.getByRole('button', { name: 'Eliminar registro' }).click();
  await expect(page.getByText('Eliminado · Plátano')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Deshacer' })).toBeVisible();
});

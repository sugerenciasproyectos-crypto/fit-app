import { expect, test } from '@playwright/test';
import { signIn } from '../tests/db/client';
import { login, resetDiary } from './helpers';

test.beforeEach(() => resetDiary());

/** E2E-4: escanear con un código simulado (se escribe a mano; la cámara no existe en CI). */
test('E2E-4: escanear', async ({ page, context }) => {
  await context.grantPermissions([]);
  await login(page);
  await page.getByRole('button', { name: 'Añadir alimento' }).click();
  await page.getByRole('link', { name: 'Escanear código de barras' }).click();
  await page.getByRole('button', { name: 'Escribir código' }).click();
  await page.getByLabel('Código de barras').fill('3017624010701');
  await page.getByRole('button', { name: 'Buscar' }).click();

  const dialog = page.getByRole('dialog', { name: 'Cantidad' });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByText('Nutella')).toBeVisible();
  await dialog.getByRole('textbox').first().fill('15');
  await dialog.getByRole('button', { name: /^Añadir \d+ kcal$/ }).click();
  await expect(page.getByText(/Añadido · Nutella/)).toBeVisible();
});

test('código inexistente lleva a crear el producto con el código rellenado', async ({ page }) => {
  const { db } = await signIn('A');
  await db.from('products').delete().eq('barcode', '0000000000017');
  await login(page);
  await page.goto('/escanear');
  await page.getByRole('button', { name: 'Escribir código' }).click();
  await page.getByLabel('Código de barras').fill('0000000000017');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText(/no está en Open Food Facts/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel('Código de barras')).toHaveValue('0000000000017');
});

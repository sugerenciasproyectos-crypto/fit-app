import { expect, test } from '@playwright/test';
import { expectAccessible, login } from './helpers';

/** 11.5: axe sin violaciones serias en Hoy, H1, H2, Progreso, Productos y Ajustes. */
test('accesibilidad de las pantallas principales', async ({ page }) => {
  await login(page);
  await expect(page.getByTestId('remaining')).toBeVisible();
  await expectAccessible(page);

  await page.getByRole('button', { name: 'Añadir alimento' }).click();
  await page.getByPlaceholder('Buscar alimento o código').fill('avena');
  await expect(
    page.getByRole('dialog').getByRole('button', { name: /Copos de avena/ }),
  ).toBeVisible();
  await expectAccessible(page); // H1
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Copos de avena/ })
    .click();
  await expect(page.getByRole('dialog', { name: 'Cantidad' })).toBeVisible();
  await expectAccessible(page); // H2
  await page.getByRole('button', { name: 'Cerrar' }).click();

  for (const [tab, heading] of [
    ['Progreso', 'Progreso'],
    ['Productos', 'Productos'],
    ['Ajustes', 'Ajustes'],
  ] as const) {
    await page
      .getByRole('navigation', { name: 'Secciones' })
      .getByRole('link', { name: tab })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expectAccessible(page);
  }
});

test('el texto al 200 % no rompe Hoy', async ({ page }) => {
  await login(page);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await expect(page.getByTestId('remaining')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

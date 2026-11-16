import { expect, test } from '@playwright/test';
import { signIn } from '../tests/db/client';
import { login } from './helpers';

const NAME = 'ZZ Arroz con aceite';

async function cleanup() {
  const { db } = await signIn('A');
  await db.from('products').delete().eq('name', NAME);
}
test.beforeEach(cleanup);
test.afterEach(cleanup);

test('receta: ingredientes, peso cocinado, raciones y guardado como producto', async ({ page }) => {
  await login(page);
  await page.goto('/productos/recetas/nueva');
  await page.getByLabel('Nombre').fill(NAME);

  await page.getByRole('button', { name: '+ Añadir ingrediente' }).click();
  await page.getByPlaceholder('Buscar alimento o código').fill('arroz blanco crudo');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Arroz blanco \(crudo\)/ })
    .click();
  await page.getByRole('button', { name: '+ Añadir ingrediente' }).click();
  await page.getByPlaceholder('Buscar alimento o código').fill('aceite de oliva');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Aceite de oliva/ })
    .click();

  const qty = page.getByLabel('Cantidad');
  await qty.nth(0).fill('200');
  await qty.nth(1).fill('10');
  await page.getByLabel('Peso cocinado (opcional)').fill('500');
  await page.getByLabel('Raciones (opcional)').fill('2');

  // g + ml sin densidad → aviso
  await expect(page.getByText(/Mezcla g y ml/)).toBeVisible();
  // (200·360 + 10·820)/500·100 = 160,4 kcal/100 g
  await expect(page.getByText('kcal / 100 g').locator('..')).toContainText('160');

  await page.getByRole('button', { name: 'Guardar receta' }).click();
  await expect(page.getByText('Receta guardada')).toBeVisible();
  await expect(page).toHaveURL(/\/productos\/recetas\/[0-9a-f-]{36}$/);

  const { db } = await signIn('A');
  const { data } = await db
    .from('products')
    .select('source, energy_kcal, needs_review, portions!portions_product_id_fkey(name, amount)')
    .eq('name', NAME)
    .single();
  expect(data).toMatchObject({ source: 'receta', energy_kcal: 160.4, needs_review: true });
  expect(data!.portions).toEqual([{ name: 'ración', amount: 250 }]);
});

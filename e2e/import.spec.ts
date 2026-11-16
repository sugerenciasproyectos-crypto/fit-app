import { expect, test } from '@playwright/test';
import { signIn } from '../tests/db/client';
import { expectAccessible, login } from './helpers';

const TAG = 'E2EImport';
const json = {
  schema_version: 1,
  products: [
    {
      name: 'Hummus clásico',
      brand: TAG,
      barcode: null,
      category: 'Untables',
      base_unit: 'g',
      package_size: 240,
      nutrients_per_100: {
        energy_kcal: 290,
        protein_g: '7,1',
        carbs_g: 11,
        sugars_g: 0.9,
        fat_g: 23,
        saturated_fat_g: 2.4,
        fiber_g: 5.5,
        salt_g: 1.1,
      },
      portions: [{ name: 'cucharada', amount: 15, estimated: true }],
      supermarkets: [`${TAG} Market`],
      source: 'etiqueta',
      confidence: 'alta',
      warnings: [],
    },
    {
      name: 'Pan de semillas',
      brand: TAG,
      barcode: null,
      category: null,
      base_unit: 'g',
      package_size: null,
      nutrients_per_100: {
        energy_kcal: 260,
        protein_g: 10,
        carbs_g: 35,
        sugars_g: 3,
        fat_g: 8,
        saturated_fat_g: 1,
        fiber_g: null,
        salt_g: 1.2,
      },
      portions: [],
      supermarkets: [],
      source: 'estimado',
      confidence: 'baja',
      warnings: ['Valores aproximados de una web'],
    },
  ],
};

async function cleanup() {
  const { db } = await signIn('A');
  await db.from('products').delete().eq('brand', TAG);
  await db.from('supermarkets').delete().eq('name', `${TAG} Market`);
}

test.beforeEach(cleanup);
test.afterEach(cleanup);

test('E2E-5: importar JSON', async ({ page }) => {
  await login(page);
  await page.goto('/importar');
  await page
    .getByRole('textbox', { name: 'JSON' })
    .fill('{ "schema_version": 1, "products": [ { "name": 3 } ] }');
  await page.getByRole('button', { name: 'Validar y revisar' }).click();
  await expect(page.getByRole('alert')).toContainText('products[0].name');

  await page.getByRole('textbox', { name: 'JSON' }).fill(JSON.stringify(json));
  await page.getByRole('button', { name: 'Validar y revisar' }).click();
  await expect(page.getByRole('heading', { name: 'Vista previa' })).toBeVisible();
  await expect(page.getByText(`Crear «${TAG} Market»`)).toBeVisible();
  await expect(page.getByText('⚠')).toBeVisible();
  await expectAccessible(page);

  await page.getByRole('button', { name: 'Importar 2 · Omitir 0' }).click();
  await expect(page.getByText(/Importados: 2 nuevos/)).toBeVisible();

  const { db } = await signIn('A');
  const { data } = await db
    .from('products')
    .select('name, needs_review, protein_g')
    .eq('brand', TAG)
    .order('name');
  expect(data).toEqual([
    { name: 'Hummus clásico', needs_review: false, protein_g: 7.1 },
    { name: 'Pan de semillas', needs_review: true, protein_g: 10 },
  ]);
});

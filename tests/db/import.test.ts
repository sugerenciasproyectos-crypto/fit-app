import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { signIn, type Client } from './client';

let db: Client;
let uid: string;
const TAG = 'ZZImport';

const prod = (name: string, over: Record<string, unknown> = {}) => ({
  name,
  brand: TAG,
  barcode: null,
  category: null,
  base_unit: 'g',
  package_size: null,
  nutrients_per_100: {
    energy_kcal: 100,
    protein_g: 10,
    carbs_g: 10,
    sugars_g: 1,
    fat_g: 2,
    saturated_fat_g: 1,
    fiber_g: null,
    salt_g: null,
  },
  portions: [{ name: 'ración', amount: 50, estimated: false }],
  supermarkets: [],
  source: 'etiqueta',
  confidence: 'alta',
  warnings: [],
  needs_review: false,
  ...over,
});

async function cleanup() {
  await db.from('products').delete().eq('brand', TAG);
  await db.from('supermarkets').delete().eq('name', `${TAG} Súper`);
}

beforeAll(async () => {
  ({ db, id: uid } = await signIn('A'));
  await cleanup();
});
afterAll(cleanup);

describe('8.4 import_products', () => {
  let existingId: string;

  it('nuevo, con porciones y supermercado confirmado', async () => {
    const { data, error } = await db.rpc('import_products', {
      payload: {
        products: [prod('Base', { supermarkets: [`${TAG} super`] })],
        new_supermarkets: [`${TAG} Súper`],
      },
      decisions: [{ index: 0, action: 'new', target: null }],
    });
    expect(error).toBeNull();
    expect(data).toMatchObject({ new: 1 });
    const { data: p } = await db
      .from('products')
      .select(
        'id, fiber_g, portions!portions_product_id_fkey(name), product_supermarkets(supermarket_id)',
      )
      .eq('brand', TAG)
      .single();
    existingId = p!.id;
    expect(p!.portions).toHaveLength(1);
    expect(p!.product_supermarkets).toHaveLength(1);
  });

  it('fusionar solo rellena los nulls y une porciones', async () => {
    const { error } = await db.rpc('import_products', {
      payload: {
        products: [
          prod('Base', {
            nutrients_per_100: { ...prod('x').nutrients_per_100, energy_kcal: 999, fiber_g: 3 },
            portions: [{ name: 'taza', amount: 80, estimated: true }],
          }),
        ],
      },
      decisions: [{ index: 0, action: 'merge', target: existingId }],
    });
    expect(error).toBeNull();
    const { data: p } = await db
      .from('products')
      .select('energy_kcal, fiber_g, portions!portions_product_id_fkey(name)')
      .eq('id', existingId)
      .single();
    expect(p!.energy_kcal).toBe(100);
    expect(p!.fiber_g).toBe(3);
    expect(p!.portions).toHaveLength(2);
  });

  it('actualizar reemplaza los campos', async () => {
    const { error } = await db.rpc('import_products', {
      payload: {
        products: [
          prod('Base', { nutrients_per_100: { ...prod('x').nutrients_per_100, energy_kcal: 150 } }),
        ],
      },
      decisions: [{ index: 0, action: 'update', target: existingId }],
    });
    expect(error).toBeNull();
    const { data } = await db.from('products').select('energy_kcal').eq('id', existingId).single();
    expect(data!.energy_kcal).toBe(150);
  });

  it('omitir no toca nada', async () => {
    const { data } = await db.rpc('import_products', {
      payload: { products: [prod('Omitido')] },
      decisions: [{ index: 0, action: 'skip', target: null }],
    });
    expect(data).toMatchObject({ skipped: 1 });
    const { count } = await db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('name', 'Omitido')
      .eq('brand', TAG);
    expect(count).toBe(0);
  });

  it('un fallo a mitad no deja nada guardado', async () => {
    const { error } = await db.rpc('import_products', {
      payload: {
        products: [prod('Atómico 1'), prod('Atómico 2', { supermarkets: ['No confirmado'] })],
      },
      decisions: [
        { index: 0, action: 'new', target: null },
        { index: 1, action: 'new', target: null },
      ],
    });
    expect(error?.message).toMatch(/Supermercado no confirmado/);
    const { count } = await db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .like('name', 'Atómico%');
    expect(count).toBe(0);
  });

  it('otro usuario no puede actualizar mis productos', async () => {
    const B = await signIn('B');
    const { error } = await B.db.rpc('import_products', {
      payload: { products: [prod('Intruso')] },
      decisions: [{ index: 0, action: 'update', target: existingId }],
    });
    expect(error?.message).toMatch(/no encontrado/);
    expect(uid).toBeTruthy();
  });
});

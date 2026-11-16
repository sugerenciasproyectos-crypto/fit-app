import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { lookupBarcode, upsertExternal, type Normalized } from '../../src/features/external/cache';
import { signIn, type Client } from './client';

let db: Client;
let uid: string;
const SRC_ID = 'test-cache-1';

const n = (kcal: number): Normalized => ({
  name: 'Producto caché',
  brand: null,
  barcode: null,
  category: null,
  base_unit: 'g',
  package_size: null,
  energy_kcal: kcal,
  protein_g: 1,
  carbs_g: 1,
  sugars_g: 0,
  fat_g: 1,
  saturated_fat_g: 0,
  fiber_g: null,
  salt_g: null,
  source: 'usda',
  source_id: SRC_ID,
  needs_review: false,
  suggested_stores: [],
  warnings: [],
});

const cleanup = () => db.from('products').delete().eq('source_id', SRC_ID);

beforeAll(async () => {
  ({ db, id: uid } = await signIn('A'));
  await cleanup();
  await db.from('products').delete().eq('barcode', '3017624010701');
});
afterAll(async () => {
  await cleanup();
  await db.from('products').delete().eq('barcode', '3017624010701');
});

describe('6.3 caché de externos', () => {
  it('inserta y luego actualiza si no está editado', async () => {
    const a = await upsertExternal(db, uid, n(100), { v: 1 });
    const b = await upsertExternal(db, uid, n(120), { v: 2 });
    expect(b.id).toBe(a.id);
    expect(b.energy_kcal).toBe(120);
  });

  it('un producto editado a mano no cambia al volver a consultarlo', async () => {
    const { data: row } = await db.from('products').select('id').eq('source_id', SRC_ID).single();
    await db.from('products').update({ manually_edited: true, energy_kcal: 99 }).eq('id', row!.id);
    const c = await upsertExternal(db, uid, n(300), { v: 3 });
    expect(c.energy_kcal).toBe(99);
    expect(c.remote_snapshot).toEqual({ v: 3 });
  });

  it('código de barras: OFF la primera vez, local la segunda', async () => {
    const first = await lookupBarcode(db, uid, '3017624010701');
    expect(first.kind).toBe('remote');
    const second = await lookupBarcode(db, uid, '3017624010701');
    expect(second.kind).toBe('local');
    const none = await lookupBarcode(db, uid, '0000000000017');
    expect(none.kind).toBe('not_found');
  });
});

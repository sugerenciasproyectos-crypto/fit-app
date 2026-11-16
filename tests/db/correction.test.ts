import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { signIn, type Client } from './client';

let db: Client;
let uid: string;
let productId: string;
let slot: string;
const entryIds: string[] = [];

const per100 = {
  energy_kcal: 100,
  protein_g: 10,
  carbs_g: 10,
  sugars_g: 1,
  fat_g: 2,
  saturated_fat_g: 1,
  fiber_g: null,
  salt_g: null,
};

beforeAll(async () => {
  ({ db, id: uid } = await signIn('A'));
  const { data: p } = await db
    .from('products')
    .insert({ user_id: uid, name: 'ZZ Corrección', source: 'manual', ...per100 })
    .select('id')
    .single();
  productId = p!.id;
  const { data: s } = await db.from('meal_slots').select('id').limit(1).single();
  slot = s!.id;
  for (const [day, exported] of [
    ['2026-01-01', false],
    ['2026-01-10', true],
    ['2026-02-01', false],
  ] as const) {
    const { data } = await db
      .from('diary_entries')
      .insert({
        user_id: uid,
        day,
        meal_slot_id: slot,
        product_id: productId,
        quantity: 200,
        unit: 'g',
        product_name: 'ZZ Corrección',
        per100,
        energy_kcal: 200,
        protein_g: 20,
        carbs_g: 20,
        exported_at: exported ? new Date().toISOString() : null,
      })
      .select('id')
      .single();
    entryIds.push(data!.id);
  }
  await db.from('products').update({ energy_kcal: 150 }).eq('id', productId);
});

afterAll(async () => {
  await db.from('diary_entries').delete().in('id', entryIds);
  await db.from('products').delete().eq('id', productId);
});

describe('9.3 apply_product_correction', () => {
  it('vista previa: cuenta registros y variación sin cambiar nada', async () => {
    const { data } = await db.rpc('apply_product_correction', {
      p_product: productId,
      p_from: '2026-01-01',
      p_to: '2026-01-31',
      p_dry: true,
    });
    expect(data).toEqual({ rows: 2, kcal_delta: 200 });
    const { data: e } = await db
      .from('diary_entries')
      .select('energy_kcal')
      .eq('id', entryIds[0]!)
      .single();
    expect(e!.energy_kcal).toBe(200);
  });

  it('recalcula solo el rango y marca export_dirty en lo ya exportado', async () => {
    const { data } = await db.rpc('apply_product_correction', {
      p_product: productId,
      p_from: '2026-01-01',
      p_to: '2026-01-31',
    });
    expect(data).toEqual({ rows: 2, kcal_delta: 200 });
    const { data: rows } = await db
      .from('diary_entries')
      .select('day, energy_kcal, export_dirty, per100')
      .in('id', entryIds)
      .order('day');
    expect(rows!.map((r) => [r.day, r.energy_kcal, r.export_dirty])).toEqual([
      ['2026-01-01', 300, false],
      ['2026-01-10', 300, true],
      ['2026-02-01', 200, false],
    ]);
    expect((rows![0]!.per100 as { energy_kcal: number }).energy_kcal).toBe(150);
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import { parseInterchange } from '../../packages/schemas/src';
import { buildBackup, normalizeBackup, type Backup } from '../../src/features/backup/export';
import { signIn, type Client } from './client';

let db: Client;
let uid: string;

const TABLES = [
  'diary_entries',
  'saved_meal_items',
  'saved_meals',
  'recipe_ingredients',
  'recipes',
  'product_supermarkets',
  'portions',
  'products',
  'supermarkets',
  'day_flags',
  'weights',
  'daily_activity',
  'tdee_proposals',
] as const;

async function wipe() {
  for (const t of TABLES) await db.from(t).delete().eq('user_id', uid);
}

/** Datos de ejemplo de B, con todas las claves de la copia representadas. */
async function seed() {
  const { data: slot } = await db
    .from('meal_slots')
    .select('id')
    .order('position')
    .limit(1)
    .single();
  const { data: sm } = await db
    .from('supermarkets')
    .insert({ user_id: uid, name: 'Súper Backup' })
    .select()
    .single();
  const { data: p } = await db
    .from('products')
    .insert({
      user_id: uid,
      name: 'Avena backup',
      source: 'manual',
      energy_kcal: 379,
      protein_g: 13.2,
      favorite: true,
    })
    .select()
    .single();
  await db.from('portions').insert({ user_id: uid, product_id: p!.id, name: 'puñado', amount: 40 });
  await db
    .from('product_supermarkets')
    .insert({ user_id: uid, product_id: p!.id, supermarket_id: sm!.id, price_eur: 1.25 });
  const { data: rp } = await db
    .from('products')
    .insert({ user_id: uid, name: 'Gachas', source: 'receta', energy_kcal: 120 })
    .select()
    .single();
  const { data: r } = await db
    .from('recipes')
    .insert({ user_id: uid, product_id: rp!.id, servings: 2 })
    .select()
    .single();
  await db
    .from('recipe_ingredients')
    .insert({ user_id: uid, recipe_id: r!.id, product_id: p!.id, quantity: 80, position: 0 });
  const { data: m } = await db
    .from('saved_meals')
    .insert({ user_id: uid, name: 'Desayuno' })
    .select()
    .single();
  await db
    .from('saved_meal_items')
    .insert({ user_id: uid, saved_meal_id: m!.id, product_id: p!.id, quantity: 60 });
  await db.from('diary_entries').insert({
    user_id: uid,
    day: '2025-05-05',
    meal_slot_id: slot!.id,
    product_id: p!.id,
    quantity: 60,
    unit: 'g',
    product_name: 'Avena backup',
    per100: { energy_kcal: 379 },
    energy_kcal: 227.4,
  });
  await db.from('day_flags').insert({ user_id: uid, day: '2025-05-04', incomplete: true });
  await db.from('weights').insert({
    user_id: uid,
    day: '2025-05-05',
    weight_kg: 70.5,
    source: 'manual',
    measured_at: '2025-05-05T07:00:00Z',
  });
  await db
    .from('daily_activity')
    .insert({ user_id: uid, day: '2025-05-05', steps: 8000, active_kcal: 300 });
  await db.from('tdee_proposals').insert({
    user_id: uid,
    week_start: '2025-04-28',
    status: 'skipped',
    skip_reason: 'arranque',
    tdee_before: 2200,
  });
}

beforeAll(async () => {
  ({ db, id: uid } = await signIn('B'));
  await wipe();
  await seed();
});

describe('11.1–11.2 copia de seguridad', () => {
  let first: Backup;

  it('la exportación incluye todas las claves y valida contra su propio esquema', async () => {
    first = await buildBackup(db);
    for (const k of [
      'meal_slots',
      'supermarkets',
      'products',
      'recipes',
      'saved_meals',
      'diary',
      'day_flags',
      'weights',
      'daily_activity',
      'tdee_history',
    ]) {
      expect((first as unknown as Record<string, unknown[]>)[k]!.length, k).toBeGreaterThan(0);
    }
    const r = parseInterchange(JSON.parse(JSON.stringify(first)));
    expect(r.ok && r.kind).toBe('backup');
  });

  it('ida y vuelta: exportar → restaurar en una base vacía → exportar da lo mismo', async () => {
    await wipe();
    const { data, error } = await db.rpc('restore_backup', {
      payload: JSON.parse(JSON.stringify(first)),
    });
    expect(error?.message ?? null).toBeNull();
    expect(data).toMatchObject({ products: 2, diary: 1, recipes: 1, saved_meals: 1, weights: 1 });
    const second = await buildBackup(db);
    expect(normalizeBackup(second)).toEqual(normalizeBackup(first));
  });

  it('limpieza', async () => {
    await wipe();
  });
});

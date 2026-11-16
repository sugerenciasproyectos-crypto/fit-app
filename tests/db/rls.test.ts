/**
 * RLS-1 contra calorias-dev: un usuario B no puede leer ni escribir datos de A en ninguna tabla.
 * Requiere .env.local (URL y clave pública) y .env.test.local (usuarios de prueba A y B).
 */
import { createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/lib/db.types';
import { env } from './env';

type Client = ReturnType<typeof createClient<Database>>;
type Table = keyof Database['public']['Tables'];

async function signIn(tag: 'A' | 'B'): Promise<{ db: Client; id: string }> {
  const db = createClient<Database>(env('VITE_SUPABASE_URL'), env('VITE_SUPABASE_ANON_KEY'), {
    auth: { persistSession: false },
  });
  const { data, error } = await db.auth.signInWithPassword({
    email: env(`TEST_${tag}_EMAIL`),
    password: env(`TEST_${tag}_PASSWORD`),
  });
  if (error) throw error;
  return { db, id: data.user.id };
}

const TABLES: Table[] = [
  'profiles',
  'meal_slots',
  'products',
  'portions',
  'supermarkets',
  'product_supermarkets',
  'recipes',
  'recipe_ingredients',
  'saved_meals',
  'saved_meal_items',
  'diary_entries',
  'day_flags',
  'weights',
  'health_samples',
  'daily_activity',
  'tdee_proposals',
  'api_tokens',
];

let A: { db: Client; id: string };
let B: { db: Client; id: string };
let productA: string;

beforeAll(async () => {
  [A, B] = await Promise.all([signIn('A'), signIn('B')]);
  const { data, error } = await A.db
    .from('products')
    .insert({ user_id: A.id, name: 'RLS producto de A', source: 'manual' })
    .select('id')
    .single();
  if (error) throw error;
  productA = data.id;
});

describe('RLS-1: aislamiento entre usuarios', () => {
  it('A ve sus comidas por defecto (trigger de alta)', async () => {
    const { data } = await A.db.from('meal_slots').select('name').order('position');
    expect(data?.map((m) => m.name)).toEqual(['Desayuno', 'Comida', 'Merienda', 'Cena', 'Snacks']);
  });

  it.each(TABLES)('B no lee filas de A en %s', async (t) => {
    const { data, error } = await B.db.from(t as 'products').select('user_id').eq('user_id', A.id);
    if (t === 'api_tokens') {
      // sin permiso de columna user_id para authenticated: error o vacío
      expect(error !== null || data?.length === 0).toBe(true);
    } else {
      expect(error).toBeNull();
      expect(data).toEqual([]);
    }
  });

  it('B no puede insertar filas a nombre de A', async () => {
    const { error } = await B.db
      .from('products')
      .insert({ user_id: A.id, name: 'intruso', source: 'manual' });
    expect(error?.code).toBe('42501');
  });

  it('B no puede modificar ni borrar el producto de A', async () => {
    const upd = await B.db
      .from('products')
      .update({ name: 'hackeado' })
      .eq('id', productA)
      .select();
    expect(upd.data).toEqual([]);
    const del = await B.db.from('products').delete().eq('id', productA).select();
    expect(del.data).toEqual([]);
    const { data } = await A.db.from('products').select('name').eq('id', productA).single();
    expect(data?.name).toBe('RLS producto de A');
  });

  it('el seed es legible por todos', async () => {
    const { error } = await B.db.from('seed_products').select('id').limit(1);
    expect(error).toBeNull();
  });

  it('limpieza', async () => {
    const { error } = await A.db.from('products').delete().eq('id', productA);
    expect(error).toBeNull();
  });
});

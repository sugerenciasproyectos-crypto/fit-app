/** Copia de seguridad completa en el formato de intercambio v1 ampliado (Backend Schema §8). */
import type { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/db.types';
import { NUTRIENT_KEYS } from '../../domain/nutrition';

type Client = ReturnType<typeof createClient<Database>>;
type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

async function all<T>(q: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

const nutrients = (r: Record<string, unknown>) =>
  Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, (r[k] as number | null) ?? null]));

export async function buildBackup(db: Client, now = new Date()) {
  const [
    profile,
    slots,
    markets,
    products,
    portions,
    links,
    recipes,
    ingredients,
    meals,
    items,
    diary,
    flags,
    weights,
    activity,
    tdee,
  ] = await Promise.all([
    db.from('profiles').select('*').maybeSingle(),
    all(db.from('meal_slots').select('*').order('position')),
    all(db.from('supermarkets').select('*').order('name')),
    all(db.from('products').select('*').order('created_at')),
    all(db.from('portions').select('*').order('name')),
    all(db.from('product_supermarkets').select('*')),
    all(db.from('recipes').select('*').is('deleted_at', null)),
    all(db.from('recipe_ingredients').select('*').order('position')),
    all(db.from('saved_meals').select('*').is('deleted_at', null)),
    all(db.from('saved_meal_items').select('*').order('position')),
    all(db.from('diary_entries').select('*').order('logged_at')),
    all(db.from('day_flags').select('*').order('day')),
    all(db.from('weights').select('*').order('day')),
    all(db.from('daily_activity').select('*').order('day')),
    all(db.from('tdee_proposals').select('*').order('week_start')),
  ]);
  if (profile.error) throw profile.error;
  const marketName = new Map(markets.map((m) => [m.id, m.name]));
  const strip = <T extends Record<string, unknown>>(r: T, ...keys: string[]) =>
    Object.fromEntries(Object.entries(r).filter(([k]) => !['user_id', ...keys].includes(k)));

  return {
    schema_version: 1 as const,
    exported_at: now.toISOString(),
    profile: profile.data ? strip(profile.data, 'created_at', 'updated_at') : undefined,
    meal_slots: slots.map((s) => ({
      id: s.id,
      name: s.name,
      position: s.position,
      start_time: s.start_time,
      archived: s.archived,
    })),
    supermarkets: markets.map((m) => ({ id: m.id, name: m.name })),
    products: products.map((p: Row<'products'>) => {
      const ls = links.filter((l) => l.product_id === p.id);
      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        barcode: p.barcode,
        category: p.category,
        base_unit: p.base_unit,
        package_size: p.package_size,
        nutrients_per_100: nutrients(p),
        portions: portions
          .filter((x) => x.product_id === p.id)
          .map((x) => ({ name: x.name, amount: x.amount, estimated: x.is_estimated })),
        supermarkets: ls.map((l) => marketName.get(l.supermarket_id)!).filter(Boolean),
        supermarket_prices: ls.map((l) => ({
          name: marketName.get(l.supermarket_id)!,
          price: l.price_eur,
        })),
        source: p.source,
        source_id: p.source_id,
        confidence: p.confidence,
        warnings: p.warnings,
        favorite: p.favorite,
        manually_edited: p.manually_edited,
        needs_review: p.needs_review,
        deleted_at: p.deleted_at,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    }),
    recipes: recipes.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      servings: r.servings,
      cooked_weight_g: r.cooked_weight_g,
      notes: r.notes,
      ingredients: ingredients
        .filter((i) => i.recipe_id === r.id)
        .map((i) => ({ product_id: i.product_id, quantity: i.quantity, position: i.position })),
    })),
    saved_meals: meals.map((m) => ({
      id: m.id,
      name: m.name,
      favorite: m.favorite,
      items: items
        .filter((i) => i.saved_meal_id === m.id)
        .map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          portion_count: i.portion_count,
          position: i.position,
        })),
    })),
    diary: diary.map((e) => ({
      id: e.id,
      day: e.day,
      logged_at: e.logged_at,
      meal_slot_id: e.meal_slot_id,
      product_id: e.product_id,
      quantity: e.quantity,
      unit: e.unit,
      portion_name: e.portion_name,
      portion_count: e.portion_count,
      product_name: e.product_name,
      product_brand: e.product_brand,
      per100: e.per100,
      nutrients: nutrients(e),
      exported_at: e.exported_at,
    })),
    day_flags: flags.map((f) => ({ day: f.day, incomplete: f.incomplete })),
    weights: weights.map((w) => ({
      id: w.id,
      day: w.day,
      weight_kg: w.weight_kg,
      source: w.source,
      measured_at: w.measured_at,
    })),
    daily_activity: activity.map((a) => ({
      day: a.day,
      steps: a.steps,
      active_kcal: a.active_kcal,
    })),
    tdee_history: tdee.map((t) => strip(t)),
  };
}

export type Backup = Awaited<ReturnType<typeof buildBackup>>;

/** Para comparar dos copias: sin marcas de tiempo de exportación ni de actualización. */
export function normalizeBackup(b: Backup) {
  const clone = structuredClone(b) as Record<string, unknown> & Backup;
  delete (clone as Partial<Backup>).exported_at;
  if (clone.profile) {
    delete (clone.profile as Record<string, unknown>).last_backup_at;
  }
  clone.products = clone.products.map((p) => ({ ...p, updated_at: '' }));
  clone.tdee_history = clone.tdee_history.map((t) => ({ ...t, created_at: '' }));
  const byKey = <T extends Record<string, unknown>>(arr: T[], k: string) =>
    [...arr].sort((a, b) => String(a[k]).localeCompare(String(b[k])));
  clone.products = byKey(clone.products, 'id');
  clone.diary = byKey(clone.diary, 'id');
  clone.supermarkets = byKey(clone.supermarkets, 'id');
  for (const p of clone.products) {
    p.portions = byKey(p.portions, 'name');
    p.supermarket_prices = byKey(p.supermarket_prices, 'name');
    p.supermarkets = [...p.supermarkets].sort();
  }
  return clone;
}

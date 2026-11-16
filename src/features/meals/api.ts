import { useQuery } from '@tanstack/react-query';
import { NUTRIENT_KEYS, type Nutrients } from '../../domain/nutrition';
import { supabase, type Tables } from '../../lib/supabase';
import { buildEntryRow, type Entry } from '../diary/api';
import type { Product } from '../products/api';

export type SavedMeal = Tables<'saved_meals'>;
export type SavedMealItem = Tables<'saved_meal_items'> & { product: Product };
export type SavedMealWithItems = SavedMeal & { items: SavedMealItem[] };

export const savedMealsKey = ['saved_meals'] as const;

const SELECT = '*, items:saved_meal_items(*, product:products(*))';

export function useSavedMeals() {
  return useQuery({
    queryKey: savedMealsKey,
    queryFn: async (): Promise<SavedMealWithItems[]> => {
      const { data, error } = await supabase
        .from('saved_meals')
        .select(SELECT)
        .is('deleted_at', null)
        .order('last_used_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data as unknown as SavedMealWithItems[]).map((m) => ({
        ...m,
        items: [...m.items].sort((a, b) => a.position - b.position),
      }));
    },
  });
}

export function savedMealKcal(m: SavedMealWithItems): number {
  return m.items.reduce((s, i) => s + (i.quantity * (i.product.energy_kcal ?? 0)) / 100, 0);
}

export interface MealItemDraft {
  product: Product;
  quantity: number;
  portion_id: string | null;
  portion_count: number | null;
}

export async function saveSavedMeal(
  userId: string,
  id: string | null,
  name: string,
  favorite: boolean,
  items: MealItemDraft[],
): Promise<string> {
  let mealId = id;
  if (id) {
    const { error } = await supabase.from('saved_meals').update({ name, favorite }).eq('id', id);
    if (error) throw error;
    const { error: e2 } = await supabase.from('saved_meal_items').delete().eq('saved_meal_id', id);
    if (e2) throw e2;
  } else {
    const { data, error } = await supabase
      .from('saved_meals')
      .insert({ user_id: userId, name, favorite })
      .select('id')
      .single();
    if (error) throw error;
    mealId = data.id;
  }
  if (items.length) {
    const { error } = await supabase.from('saved_meal_items').insert(
      items.map((it, position) => ({
        user_id: userId,
        saved_meal_id: mealId!,
        product_id: it.product.id,
        quantity: it.quantity,
        portion_id: it.portion_id,
        portion_count: it.portion_count,
        position,
      })),
    );
    if (error) throw error;
  }
  return mealId!;
}

export async function deleteSavedMeal(id: string) {
  const { error } = await supabase
    .from('saved_meals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Registra todos los ítems de una comida guardada; devuelve las filas para poder deshacer. */
export async function logSavedMeal(
  userId: string,
  day: string,
  mealSlotId: string,
  meal: SavedMealWithItems,
): Promise<Entry[]> {
  const rows = meal.items.map((i) => ({
    ...buildEntryRow(userId, {
      day,
      mealSlotId,
      product: i.product,
      quantity: i.quantity,
      portion: null,
    }),
    saved_meal_id: meal.id,
    portion_count: i.portion_count,
  }));
  const { data, error } = await supabase.from('diary_entries').insert(rows).select();
  if (error) throw error;
  await supabase
    .from('saved_meals')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', meal.id);
  return data;
}

export async function deleteEntries(ids: string[]) {
  const { error } = await supabase.from('diary_entries').delete().in('id', ids);
  if (error) throw error;
}

/**
 * Copia registros a otro día/comida con un snapshot nuevo, recalculado con los valores actuales
 * del producto (si el producto ya no existe, se usa el per100 guardado).
 */
export async function copyEntries(
  userId: string,
  entries: Entry[],
  day: string,
  mealSlotId: string | null,
): Promise<Entry[]> {
  if (!entries.length) return [];
  const ids = [...new Set(entries.map((e) => e.product_id).filter((x): x is string => !!x))];
  const { data: products, error } = ids.length
    ? await supabase.from('products').select('*').in('id', ids)
    : { data: [] as Product[], error: null };
  if (error) throw error;
  const byId = new Map(products!.map((p) => [p.id, p]));
  const rows = entries.map((e) => {
    const current = e.product_id ? byId.get(e.product_id) : undefined;
    const product: Product =
      current ??
      ({
        id: e.product_id,
        name: e.product_name,
        brand: e.product_brand,
        base_unit: e.unit,
        ...(Object.fromEntries(
          NUTRIENT_KEYS.map((k) => [k, (e.per100 as unknown as Nutrients)[k]]),
        ) as Nutrients),
      } as unknown as Product);
    return {
      ...buildEntryRow(userId, {
        day,
        mealSlotId: mealSlotId ?? e.meal_slot_id,
        product,
        quantity: e.quantity,
        portion: null,
      }),
      product_id: e.product_id,
      portion_id: e.portion_id,
      portion_name: e.portion_name,
      portion_count: e.portion_count,
    };
  });
  const { data, error: e2 } = await supabase.from('diary_entries').insert(rows).select();
  if (e2) throw e2;
  return data;
}

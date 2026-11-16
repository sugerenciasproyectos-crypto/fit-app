import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NUTRIENT_KEYS, snapshot, type Nutrients } from '../../domain/nutrition';
import type { Json } from '../../lib/db.types';
import { supabase, type Tables } from '../../lib/supabase';
import type { Product } from '../products/api';
import { productsKey } from '../products/api';

export type Entry = Tables<'diary_entries'>;
export type MealSlot = Tables<'meal_slots'>;

export const diaryKey = (day: string) => ['diary', day] as const;
export const slotsKey = ['meal_slots'] as const;
export const dayFlagKey = (day: string) => ['day_flag', day] as const;

export function useMealSlots() {
  return useQuery({
    queryKey: slotsKey,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<MealSlot[]> => {
      const { data, error } = await supabase
        .from('meal_slots')
        .select('*')
        .eq('archived', false)
        .order('position');
      if (error) throw error;
      return data;
    },
  });
}

export function useDiary(day: string) {
  return useQuery({
    queryKey: diaryKey(day),
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('day', day)
        .order('logged_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useDayFlag(day: string) {
  return useQuery({
    queryKey: dayFlagKey(day),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('day_flags')
        .select('incomplete')
        .eq('day', day)
        .maybeSingle();
      if (error) throw error;
      return data?.incomplete ?? false;
    },
  });
}

export async function setDayIncomplete(userId: string, day: string, incomplete: boolean) {
  const { error } = incomplete
    ? await supabase.from('day_flags').upsert({ user_id: userId, day, incomplete: true })
    : await supabase.from('day_flags').delete().eq('day', day);
  if (error) throw error;
}

export function per100Of(p: Pick<Product, (typeof NUTRIENT_KEYS)[number]>): Nutrients {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, p[k]])) as Nutrients;
}

export function entryNutrientsOf(e: Entry): Nutrients {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, e[k]])) as Nutrients;
}

export interface NewEntry {
  day: string;
  mealSlotId: string;
  product: Product;
  quantity: number;
  portion?: { id: string; name: string; count: number } | null;
}

/** Fila con snapshot (M16): per100 y los 8 valores calculados en ese momento. */
export function buildEntryRow(userId: string, n: NewEntry) {
  const snap = snapshot(n.quantity, per100Of(n.product));
  return {
    user_id: userId,
    day: n.day,
    meal_slot_id: n.mealSlotId,
    product_id: n.product.id,
    quantity: n.quantity,
    unit: n.product.base_unit,
    portion_id: n.portion?.id ?? null,
    portion_name: n.portion?.name ?? null,
    portion_count: n.portion?.count ?? null,
    product_name: n.product.name,
    product_brand: n.product.brand,
    per100: snap.per100 as unknown as Json,
    ...snap.nutrients,
  };
}

export function useAddEntry(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (n: NewEntry) => {
      const row = buildEntryRow(userId, n);
      const { data, error } = await supabase.from('diary_entries').insert(row).select().single();
      if (error) throw error;
      await supabase
        .from('products')
        .update({
          last_used_at: new Date().toISOString(),
          last_quantity: n.portion ? n.portion.count : n.quantity,
          last_portion_id: n.portion?.id ?? null,
        })
        .eq('id', n.product.id);
      return data;
    },
    onMutate: async (n) => {
      const key = diaryKey(n.day);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Entry[]>(key);
      const optimistic = {
        ...buildEntryRow(userId, n),
        id: `tmp-${crypto.randomUUID()}`,
        logged_at: new Date().toISOString(),
        created_at: '',
        updated_at: '',
        snapshot_at: '',
        exported_at: null,
        export_dirty: false,
        saved_meal_id: null,
      } as Entry;
      qc.setQueryData<Entry[]>(key, (old) => [...(old ?? []), optimistic]);
      return { prev, key };
    },
    onError: (_e, _n, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: (_d, _e, n) => {
      qc.invalidateQueries({ queryKey: diaryKey(n.day) });
      qc.invalidateQueries({ queryKey: productsKey });
    },
  });
}

export interface EntryUpdate {
  entry: Entry;
  quantity: number;
  mealSlotId: string;
  day: string;
  portion?: { id: string; name: string; count: number } | null;
}

/** Editar cantidad o mover: recalcula con el per100 del snapshot (no con el producto actual). */
export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (u: EntryUpdate) => {
      const per100 = u.entry.per100 as unknown as Nutrients;
      const snap = snapshot(u.quantity, per100);
      const { error } = await supabase
        .from('diary_entries')
        .update({
          quantity: u.quantity,
          meal_slot_id: u.mealSlotId,
          day: u.day,
          portion_id: u.portion?.id ?? null,
          portion_name: u.portion?.name ?? null,
          portion_count: u.portion?.count ?? null,
          ...snap.nutrients,
        })
        .eq('id', u.entry.id);
      if (error) throw error;
    },
    onSettled: (_d, _e, u) => {
      qc.invalidateQueries({ queryKey: diaryKey(u.entry.day) });
      qc.invalidateQueries({ queryKey: diaryKey(u.day) });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: Entry) => {
      const { error } = await supabase.from('diary_entries').delete().eq('id', e.id);
      if (error) throw error;
    },
    onMutate: async (e) => {
      const key = diaryKey(e.day);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Entry[]>(key);
      qc.setQueryData<Entry[]>(key, (old) => old?.filter((x) => x.id !== e.id));
      return { prev, key };
    },
    onError: (_err, _e, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: (_d, _err, e) => qc.invalidateQueries({ queryKey: diaryKey(e.day) }),
  });
}

/** Deshacer un borrado: vuelve a insertar la fila tal cual (mismo snapshot). */
export async function restoreEntry(e: Entry) {
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = e;
  const { error } = await supabase.from('diary_entries').insert(rest);
  if (error) throw error;
}

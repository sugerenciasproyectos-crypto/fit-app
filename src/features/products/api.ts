import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, type Tables } from '../../lib/supabase';
import type { Database } from '../../lib/db.types';

export type Product = Tables<'products'>;
export type Portion = Tables<'portions'>;
export type ProductSource = Database['public']['Enums']['product_source'];
export type ProductWithPortions = Product & { portions: Portion[] };

export const SOURCE_LABEL: Record<ProductSource, string> = {
  etiqueta: 'Etiqueta',
  web: 'Web',
  estimado: 'Estimado',
  openfoodfacts: 'Open Food Facts',
  usda: 'USDA',
  manual: 'Manual',
  receta: 'Receta',
  aesan: 'AESAN',
  seed: 'Catálogo',
};

export interface SearchFilters {
  q: string;
  onlyFav?: boolean;
  supermarket?: string | null;
  source?: ProductSource | null;
  review?: boolean;
  limit?: number;
}

export const productsKey = ['products'] as const;

export function useProductSearch(f: SearchFilters) {
  return useQuery({
    queryKey: [...productsKey, 'search', f],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.rpc('search_products', {
        q: f.q,
        only_fav: f.onlyFav ?? false,
        supermarket: f.supermarket ?? undefined,
        lim: f.limit ?? 60,
      });
      if (error) throw error;
      return data.filter(
        (p) => (!f.source || p.source === f.source) && (!f.review || p.needs_review),
      );
    },
  });
}

const WITH_PORTIONS = '*, portions!portions_product_id_fkey(*)';

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [...productsKey, 'one', id],
    enabled: !!id,
    queryFn: async (): Promise<ProductWithPortions> => {
      const { data, error } = await supabase
        .from('products')
        .select(WITH_PORTIONS)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return { ...data, portions: [...data.portions].sort((a, b) => a.amount - b.amount) };
    },
  });
}

export type ProductPatch = Omit<
  Database['public']['Tables']['products']['Insert'],
  'user_id' | 'id' | 'name_norm'
>;
export interface PortionDraft {
  id?: string;
  name: string;
  amount: number;
}

/** Guarda un producto (alta o edición) y sincroniza sus porciones. */
export async function saveProduct(
  userId: string,
  id: string | null,
  patch: ProductPatch,
  portions: PortionDraft[],
): Promise<string> {
  let productId = id;
  if (id) {
    const { error } = await supabase.from('products').update(patch).eq('id', id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...patch, user_id: userId })
      .select('id')
      .single();
    if (error) throw error;
    productId = data.id;
  }
  const pid = productId!;
  const { data: existing, error: e1 } = await supabase
    .from('portions')
    .select('id')
    .eq('product_id', pid);
  if (e1) throw e1;
  const keep = new Set(portions.filter((p) => p.id).map((p) => p.id!));
  const remove = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
  if (remove.length) {
    const { error } = await supabase.from('portions').delete().in('id', remove);
    if (error) throw error;
  }
  for (const p of portions) {
    const row = { user_id: userId, product_id: pid, name: p.name, amount: p.amount };
    const { error } = p.id
      ? await supabase.from('portions').update(row).eq('id', p.id)
      : await supabase.from('portions').insert(row);
    if (error) throw error;
  }
  return pid;
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      const { error } = await supabase.from('products').update({ favorite }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: productsKey }),
  });
}

/** Borrado lógico: desaparece de las búsquedas, se conserva en los registros antiguos. */
export async function softDeleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

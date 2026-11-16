import { useQuery } from '@tanstack/react-query';
import { supabase, type Tables } from '../../lib/supabase';

export type Supermarket = Tables<'supermarkets'>;
export type ProductSupermarket = Tables<'product_supermarkets'>;
export const supermarketsKey = ['supermarkets'] as const;

export function useSupermarkets() {
  return useQuery({
    queryKey: supermarketsKey,
    queryFn: async (): Promise<Supermarket[]> => {
      const { data, error } = await supabase.from('supermarkets').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useProductSupermarkets(productId: string | undefined) {
  return useQuery({
    queryKey: [...supermarketsKey, 'of', productId],
    enabled: !!productId,
    queryFn: async (): Promise<ProductSupermarket[]> => {
      const { data, error } = await supabase
        .from('product_supermarkets')
        .select('*')
        .eq('product_id', productId!);
      if (error) throw error;
      return data;
    },
  });
}

export async function createSupermarket(userId: string, name: string) {
  const { data, error } = await supabase
    .from('supermarkets')
    .insert({ user_id: userId, name: name.trim() })
    .select()
    .single();
  if (error) {
    if (error.message.includes('supermarkets_name_uq'))
      throw new Error('Ya existe un supermercado con ese nombre');
    throw error;
  }
  return data;
}

export async function renameSupermarket(id: string, name: string) {
  const { error } = await supabase.from('supermarkets').update({ name: name.trim() }).eq('id', id);
  if (error) {
    if (error.message.includes('supermarkets_name_uq'))
      throw new Error('Ya existe un supermercado con ese nombre');
    throw error;
  }
}

export async function deleteSupermarket(id: string) {
  const { error } = await supabase.from('supermarkets').delete().eq('id', id);
  if (error) throw error;
}

export interface PriceDraft {
  supermarket_id: string;
  price: number | null;
}

/** Sincroniza la relación N:M producto–supermercado con precio. */
export async function saveProductSupermarkets(
  userId: string,
  productId: string,
  rows: PriceDraft[],
) {
  const { error: e1 } = await supabase
    .from('product_supermarkets')
    .delete()
    .eq('product_id', productId);
  if (e1) throw e1;
  if (!rows.length) return;
  const now = new Date().toISOString();
  const { error } = await supabase.from('product_supermarkets').insert(
    rows.map((r) => ({
      user_id: userId,
      product_id: productId,
      supermarket_id: r.supermarket_id,
      price_eur: r.price,
      price_updated_at: r.price === null ? null : now,
    })),
  );
  if (error) throw error;
}

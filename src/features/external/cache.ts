/** Caché de productos externos (Backend Schema §7, TRD §6.3). Cliente-agnóstico para poder testearla. */
import type { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '../../lib/db.types';

type Client = ReturnType<typeof createClient<Database>>;
type ProductRow = Database['public']['Tables']['products']['Row'];

export interface Normalized {
  name: string;
  brand: string | null;
  barcode: string | null;
  category: string | null;
  base_unit: 'g' | 'ml';
  package_size: number | null;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  sugars_g: number | null;
  fat_g: number | null;
  saturated_fat_g: number | null;
  fiber_g: number | null;
  salt_g: number | null;
  source: 'openfoodfacts' | 'usda';
  source_id: string;
  needs_review: boolean;
  suggested_stores: string[];
  warnings: string[];
}

export const REFRESH_DAYS = 90;

export function isStale(fetchedAt: string | null, now = Date.now()): boolean {
  return !fetchedAt || now - Date.parse(fetchedAt) > REFRESH_DAYS * 86_400_000;
}

/**
 * Guarda el producto elegido: inserta si no existe; si existe y no está editado a mano, actualiza
 * los campos de la API; si está editado a mano, solo guarda remote_snapshot.
 */
export async function upsertExternal(
  db: Client,
  userId: string,
  n: Normalized,
  raw: unknown,
): Promise<ProductRow> {
  const { data: existing, error: e1 } = await db
    .from('products')
    .select('*')
    .eq('source', n.source)
    .eq('source_id', n.source_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (e1) throw e1;
  const now = new Date().toISOString();
  const snapshot = { remote_snapshot: (raw ?? null) as Json, remote_fetched_at: now };
  const fields = {
    name: n.name,
    brand: n.brand,
    barcode: n.barcode,
    category: n.category,
    base_unit: n.base_unit,
    package_size: n.package_size,
    energy_kcal: n.energy_kcal,
    protein_g: n.protein_g,
    carbs_g: n.carbs_g,
    sugars_g: n.sugars_g,
    fat_g: n.fat_g,
    saturated_fat_g: n.saturated_fat_g,
    fiber_g: n.fiber_g,
    salt_g: n.salt_g,
    needs_review: n.needs_review,
    warnings: n.warnings,
    suggested_stores: n.suggested_stores,
  };
  if (existing) {
    const patch = existing.manually_edited ? snapshot : { ...fields, ...snapshot };
    const { data, error } = await db
      .from('products')
      .update(patch)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await db
    .from('products')
    .insert({ ...fields, ...snapshot, user_id: userId, source: n.source, source_id: n.source_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export type BarcodeResult =
  | { kind: 'local'; product: ProductRow }
  | { kind: 'remote'; product: ProductRow }
  | { kind: 'not_found'; code: string };

/** Primero la base local (sin llamar a OFF); si no está, o está caducado y sin editar, OFF. */
export async function lookupBarcode(
  db: Client,
  userId: string,
  code: string,
): Promise<BarcodeResult> {
  const { data: local, error } = await db
    .from('products')
    .select('*')
    .eq('barcode', code)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  const refresh =
    local &&
    local.source === 'openfoodfacts' &&
    !local.manually_edited &&
    isStale(local.remote_fetched_at);
  if (local && !refresh) return { kind: 'local', product: local };

  const { data, error: fe } = await db.functions.invoke('food-lookup', {
    body: { action: 'barcode', code },
  });
  if (fe) {
    if (local) return { kind: 'local', product: local };
    throw new Error('No se pudo consultar Open Food Facts');
  }
  if (!data.found) return local ? { kind: 'local', product: local } : { kind: 'not_found', code };
  const product = await upsertExternal(db, userId, data.product as Normalized, data.raw);
  return { kind: 'remote', product };
}

export async function searchUsda(db: Client, q: string): Promise<Normalized[]> {
  const { data, error } = await db.functions.invoke('food-lookup', {
    body: { action: 'search', q },
  });
  if (error) {
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error ?? 'No se pudo buscar en USDA');
  }
  return data.results as Normalized[];
}

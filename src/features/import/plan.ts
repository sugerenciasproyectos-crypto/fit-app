/** Lógica pura de la importación desde IA (TRD §8.2): duplicados, revisión y payload de la RPC. */
import type { Product as ImportProduct } from '../../../packages/schemas/src';
import { isKcalIncoherent, type Nutrients } from '../../domain/nutrition';

export type Action = 'update' | 'merge' | 'new' | 'skip';

export interface Existing {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
}

export interface Duplicate {
  id: string;
  name: string;
  by: 'barcode' | 'nombre';
}

/** minúsculas, sin tildes y sin espacios repetidos */
export function normKey(name: string, brand: string | null | undefined): string {
  return `${name} ${brand ?? ''}`
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function findDuplicate(p: ImportProduct, existing: readonly Existing[]): Duplicate | null {
  if (p.barcode) {
    const e = existing.find((x) => x.barcode === p.barcode);
    if (e) return { id: e.id, name: e.name, by: 'barcode' };
  }
  const key = normKey(p.name, p.brand);
  const e = existing.find((x) => normKey(x.name, x.brand) === key);
  return e ? { id: e.id, name: e.name, by: 'nombre' } : null;
}

export function needsReview(p: ImportProduct): boolean {
  return (
    p.confidence === 'baja' ||
    p.source === 'estimado' ||
    isKcalIncoherent(p.nutrients_per_100 as unknown as Nutrients)
  );
}

export function isEstimated(p: ImportProduct): boolean {
  return p.source === 'estimado' || p.portions.some((x) => x.estimated);
}

/** Supermercados del JSON que no existen todavía (comparación sin tildes ni mayúsculas). */
export function unknownSupermarkets(
  products: readonly ImportProduct[],
  known: readonly string[],
): string[] {
  const norm = (s: string) => normKey(s, null);
  const have = new Set(known.map(norm));
  const out = new Map<string, string>();
  for (const p of products)
    for (const s of p.supermarkets) if (!have.has(norm(s))) out.set(norm(s), s.trim());
  return [...out.values()];
}

export interface Row {
  product: ImportProduct;
  duplicate: Duplicate | null;
  action: Action;
}

export function initialRows(
  products: readonly ImportProduct[],
  existing: readonly Existing[],
): Row[] {
  return products.map((product) => {
    const duplicate = findDuplicate(product, existing);
    return { product, duplicate, action: duplicate ? 'update' : 'new' };
  });
}

export function buildPayload(rows: readonly Row[], newSupermarkets: readonly string[]) {
  return {
    payload: {
      products: rows.map((r) => ({ ...r.product, needs_review: needsReview(r.product) })),
      new_supermarkets: newSupermarkets,
    },
    decisions: rows.map((r, index) => ({
      index,
      action: r.action,
      target: r.action === 'update' || r.action === 'merge' ? (r.duplicate?.id ?? null) : null,
    })),
  };
}

export function summary(rows: readonly Row[]) {
  const imported = rows.filter((r) => r.action !== 'skip').length;
  return { imported, skipped: rows.length - imported };
}

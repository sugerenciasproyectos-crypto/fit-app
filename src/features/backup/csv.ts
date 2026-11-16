/** CSV para Excel en español: UTF-8 con BOM, separador ';' y coma decimal (TRD §8.3). */
import { strToU8, zipSync } from 'fflate';
import type { Backup } from './export';

const BOM = '﻿';

export function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(v).replace('.', ',');
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const cols = columns ?? [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const lines = [cols.join(';'), ...rows.map((r) => cols.map((c) => cell(r[c])).join(';'))];
  return BOM + lines.join('\r\n') + '\r\n';
}

const flatNutrients = (n: Record<string, unknown>) => Object.fromEntries(Object.entries(n));

/** Un CSV por tabla, empaquetados en un .zip. */
export function backupToZip(b: Backup): Uint8Array {
  const files: Record<string, string> = {
    'products.csv': toCsv(
      b.products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        barcode: p.barcode,
        category: p.category,
        base_unit: p.base_unit,
        package_size: p.package_size,
        ...flatNutrients(p.nutrients_per_100),
        source: p.source,
        favorite: p.favorite,
        supermarkets: p.supermarkets.join(', '),
      })),
    ),
    'diary.csv': toCsv(
      b.diary.map((e) => ({
        day: e.day,
        logged_at: e.logged_at,
        product_name: e.product_name,
        product_brand: e.product_brand,
        quantity: e.quantity,
        unit: e.unit,
        portion_name: e.portion_name,
        portion_count: e.portion_count,
        ...flatNutrients(e.nutrients),
      })),
    ),
    'weights.csv': toCsv(
      b.weights.map(({ day, weight_kg, source }) => ({ day, weight_kg, source })),
    ),
    'daily_activity.csv': toCsv(b.daily_activity),
    'tdee_history.csv': toCsv(b.tdee_history as Record<string, unknown>[]),
    'supermarkets.csv': toCsv(b.supermarkets),
  };
  return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])));
}

export function download(data: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

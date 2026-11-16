/** Borrador editable de producto (D1) y validación con los mismos límites que la base. */
import { NUTRIENT_KEYS, type BaseUnit, type NutrientKey } from '../../domain/nutrition';
import { parseDecimal } from '../../lib/format';
import type { PortionDraft, ProductPatch, ProductWithPortions } from './api';

export const NUTRIENT_LABEL: Record<NutrientKey, string> = {
  energy_kcal: 'Energía',
  protein_g: 'Proteínas',
  carbs_g: 'Hidratos de carbono',
  sugars_g: '  de los cuales azúcares',
  fat_g: 'Grasas',
  saturated_fat_g: '  de las cuales saturadas',
  fiber_g: 'Fibra',
  salt_g: 'Sal',
};

export interface ProductDraft {
  name: string;
  brand: string;
  barcode: string;
  category: string;
  base_unit: BaseUnit;
  package_size: string;
  nutrients: Record<NutrientKey, string>;
  portions: { id?: string; name: string; amount: string }[];
  favorite: boolean;
}

const str = (n: number | null | undefined) => (n == null ? '' : String(n).replace('.', ','));

export function emptyProductDraft(barcode = ''): ProductDraft {
  return {
    name: '',
    brand: '',
    barcode,
    category: '',
    base_unit: 'g',
    package_size: '',
    nutrients: Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, ''])) as Record<NutrientKey, string>,
    portions: [],
    favorite: false,
  };
}

export function draftFromProduct(p: ProductWithPortions): ProductDraft {
  return {
    name: p.name,
    brand: p.brand ?? '',
    barcode: p.barcode ?? '',
    category: p.category ?? '',
    base_unit: p.base_unit,
    package_size: str(p.package_size),
    nutrients: Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, str(p[k])])) as Record<
      NutrientKey,
      string
    >,
    portions: p.portions.map((x) => ({ id: x.id, name: x.name, amount: str(x.amount) })),
    favorite: p.favorite,
  };
}

export type ProductErrors = Partial<Record<string, string>>;

export function validateProduct(d: ProductDraft): ProductErrors {
  const e: ProductErrors = {};
  if (!d.name.trim()) e.name = 'Obligatorio';
  else if (d.name.length > 200) e.name = 'Máximo 200 caracteres';
  if (d.barcode.trim() && !/^\d{6,14}$/.test(d.barcode.trim())) e.barcode = '6 a 14 dígitos';
  if (d.package_size.trim()) {
    const v = parseDecimal(d.package_size);
    if (v === null || v <= 0) e.package_size = 'Debe ser mayor que 0';
  }
  const n: Partial<Record<NutrientKey, number>> = {};
  for (const k of NUTRIENT_KEYS) {
    const raw = d.nutrients[k].trim();
    if (!raw) continue;
    const v = parseDecimal(raw);
    const max = k === 'energy_kcal' ? 900 : 100;
    if (v === null || v < 0 || v > max) e[`nutrients.${k}`] = `Entre 0 y ${max}`;
    else n[k] = v;
  }
  if (n.sugars_g != null && n.carbs_g != null && n.sugars_g > n.carbs_g + 0.5) {
    e['nutrients.sugars_g'] = 'No puede superar los hidratos';
  }
  if (n.saturated_fat_g != null && n.fat_g != null && n.saturated_fat_g > n.fat_g + 0.5) {
    e['nutrients.saturated_fat_g'] = 'No puede superar las grasas';
  }
  const names = new Set<string>();
  d.portions.forEach((p, i) => {
    if (!p.name.trim()) e[`portions.${i}.name`] = 'Obligatorio';
    else if (names.has(p.name.trim().toLowerCase())) e[`portions.${i}.name`] = 'Repetido';
    names.add(p.name.trim().toLowerCase());
    const a = parseDecimal(p.amount);
    if (a === null || a <= 0) e[`portions.${i}.amount`] = 'Mayor que 0';
  });
  return e;
}

/** Convierte un borrador válido en columnas. `edited` marca manually_edited (TRD M14). */
export function toPatch(
  d: ProductDraft,
  edited: boolean,
): { patch: ProductPatch; portions: PortionDraft[] } {
  const num = (s: string) => (s.trim() ? parseDecimal(s) : null);
  const patch: ProductPatch = {
    name: d.name.trim(),
    brand: d.brand.trim() || null,
    barcode: d.barcode.trim() || null,
    category: d.category.trim() || null,
    base_unit: d.base_unit,
    package_size: num(d.package_size),
    favorite: d.favorite,
    ...(Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, num(d.nutrients[k])])) as Record<
      NutrientKey,
      number | null
    >),
    ...(edited ? { manually_edited: true } : {}),
  };
  const portions = d.portions.map((p) => ({
    ...(p.id ? { id: p.id } : {}),
    name: p.name.trim(),
    amount: parseDecimal(p.amount)!,
  }));
  return { patch, portions };
}

/** Mapea errores de Postgres (check constraints, índices únicos) a campos. */
export function dbErrorToField(message: string): ProductErrors {
  if (message.includes('products_barcode_uq')) {
    return { barcode: 'Ya tienes otro producto con este código' };
  }
  if (message.includes('portions_product_id_name_key')) return { portions: 'Porciones repetidas' };
  const m = /violates check constraint "products_(\w+?)_check"/.exec(message);
  if (m?.[1]) return { [`nutrients.${m[1]}`]: 'Valor fuera de rango' };
  if (message.includes('sugar_le_carbs')) {
    return { 'nutrients.sugars_g': 'No puede superar los hidratos' };
  }
  if (message.includes('sat_le_fat')) {
    return { 'nutrients.saturated_fat_g': 'No puede superar las grasas' };
  }
  return { form: message };
}

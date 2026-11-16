/**
 * Normalización de Open Food Facts y USDA (TRD §6.1–6.2). Sin APIs de Deno: se prueba con Vitest
 * y la importa la Edge Function food-lookup.
 */
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

type Dict = Record<string, unknown>;

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : null;
};
const r2 = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100);
const clamp = (n: number | null, max: number) => (n === null || n < 0 || n > max ? null : n);

export function isIncoherent(
  kcal: number | null,
  p: number | null,
  c: number | null,
  f: number | null,
) {
  if (kcal === null || p === null || c === null || f === null) return false;
  const est = 4 * p + 4 * c + 9 * f;
  if (kcal === 0) return est > 5;
  return Math.abs(kcal - est) / kcal > 0.2;
}

/** Respuesta de OFF v2 → producto, o null si status ≠ 1 (no encontrado aunque sea HTTP 200). */
export function normalizeOff(json: Dict): Normalized | null {
  if (json.status !== 1 || typeof json.product !== 'object' || json.product === null) return null;
  const p = json.product as Dict;
  const n = (p.nutriments ?? {}) as Dict;
  const serving = num(p.serving_quantity);
  const warnings: string[] = [];

  const per100 = (key: string): number | null => {
    const v = num(n[`${key}_100g`]);
    if (v !== null) return v;
    const s = num(n[`${key}_serving`]);
    if (s !== null && serving && serving > 0) return (s * 100) / serving;
    return null;
  };

  let kcal = num(n['energy-kcal_100g']);
  if (kcal === null) {
    const kj = num(n['energy_100g']);
    if (kj !== null) {
      kcal = kj / 4.184;
      warnings.push('Energía convertida desde kJ');
    }
  }
  if (kcal === null) {
    const s = num(n['energy-kcal_serving']);
    if (s !== null && serving && serving > 0) {
      kcal = (s * 100) / serving;
      warnings.push('Valores calculados desde la ración');
    }
  }

  const protein = per100('proteins');
  const carbs = per100('carbohydrates');
  const fat = per100('fat');
  const unit = String(p.product_quantity_unit ?? '').toLowerCase();
  const base_unit = unit === 'ml' || unit === 'l' || unit === 'cl' ? 'ml' : 'g';
  let pkg = num(p.product_quantity);
  if (pkg !== null && unit === 'l') pkg *= 1000;
  if (pkg !== null && unit === 'cl') pkg *= 10;

  const name = String(p.product_name_es || p.product_name || '').trim();
  const brand =
    String(p.brands ?? '')
      .split(',')[0]
      ?.trim() || null;
  const stores = String(p.stores ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const cat = Array.isArray(p.categories_tags) ? String(p.categories_tags.at(-1) ?? '') : '';

  const out: Normalized = {
    name: name || `Producto ${String(p.code ?? json.code ?? '')}`,
    brand,
    barcode: /^\d{6,14}$/.test(String(p.code ?? json.code ?? ''))
      ? String(p.code ?? json.code)
      : null,
    category: cat ? cat.replace(/^\w\w:/, '').replace(/-/g, ' ') : null,
    base_unit,
    package_size: pkg !== null && pkg > 0 ? r2(pkg) : null,
    energy_kcal: clamp(r2(kcal), 900),
    protein_g: clamp(r2(protein), 100),
    carbs_g: clamp(r2(carbs), 100),
    sugars_g: clamp(r2(per100('sugars')), 100),
    fat_g: clamp(r2(fat), 100),
    saturated_fat_g: clamp(r2(per100('saturated-fat')), 100),
    fiber_g: clamp(r2(per100('fiber')), 100),
    salt_g: clamp(r2(per100('salt')), 100),
    source: 'openfoodfacts',
    source_id: String(p.code ?? json.code ?? ''),
    needs_review: false,
    suggested_stores: stores,
    warnings,
  };
  // Las restricciones de la base: azúcares ≤ hidratos y saturadas ≤ grasa.
  if (out.sugars_g !== null && out.carbs_g !== null && out.sugars_g > out.carbs_g + 0.5)
    out.sugars_g = null;
  if (out.saturated_fat_g !== null && out.fat_g !== null && out.saturated_fat_g > out.fat_g + 0.5)
    out.saturated_fat_g = null;
  if (out.energy_kcal === null) out.needs_review = true;
  if (isIncoherent(out.energy_kcal, out.protein_g, out.carbs_g, out.fat_g)) {
    out.needs_review = true;
    out.warnings.push('Las kcal no cuadran con los macros (> 20 %)');
  }
  if (!name) out.needs_review = true;
  return out;
}

const USDA: Record<string, keyof Normalized> = {
  '208': 'energy_kcal',
  '203': 'protein_g',
  '204': 'fat_g',
  '205': 'carbs_g',
  '291': 'fiber_g',
  '269': 'sugars_g',
  '606': 'saturated_fat_g',
};

/** Un alimento de /foods/search de USDA → producto (por 100 g). */
export function normalizeUsda(food: Dict): Normalized {
  const values: Partial<Record<keyof Normalized, number>> = {};
  let sodiumMg: number | null = null;
  let atwater: number | null = null;
  for (const fnRaw of (food.foodNutrients as Dict[] | undefined) ?? []) {
    const nn = String(fnRaw.nutrientNumber ?? '');
    const v = num(fnRaw.value);
    if (v === null) continue;
    if (nn === '307') sodiumMg = v;
    // Foundation usa energía Atwater (957 general, 958 específica) en lugar de 208.
    if ((nn === '957' || nn === '958') && atwater === null) atwater = v;
    const key = USDA[nn];
    if (key) values[key] = v;
  }
  if (values.energy_kcal === undefined && atwater !== null) values.energy_kcal = atwater;
  const g = (k: keyof Normalized, max = 100) => clamp(r2(values[k] ?? null), max);
  const out: Normalized = {
    name: String(food.description ?? '').trim(),
    brand: (food.brandOwner as string | undefined)?.trim() || null,
    barcode: null,
    category: (food.foodCategory as string | undefined) ?? null,
    base_unit: 'g',
    package_size: null,
    energy_kcal: g('energy_kcal', 900),
    protein_g: g('protein_g'),
    carbs_g: g('carbs_g'),
    sugars_g: g('sugars_g'),
    fat_g: g('fat_g'),
    saturated_fat_g: g('saturated_fat_g'),
    fiber_g: g('fiber_g'),
    salt_g: sodiumMg === null ? null : clamp(r2((sodiumMg * 2.5) / 1000), 100),
    source: 'usda',
    source_id: String(food.fdcId ?? ''),
    needs_review: false,
    suggested_stores: [],
    warnings: [],
  };
  if (out.sugars_g !== null && out.carbs_g !== null && out.sugars_g > out.carbs_g + 0.5)
    out.sugars_g = null;
  if (out.saturated_fat_g !== null && out.fat_g !== null && out.saturated_fat_g > out.fat_g + 0.5)
    out.saturated_fat_g = null;
  if (
    out.energy_kcal === null ||
    isIncoherent(out.energy_kcal, out.protein_g, out.carbs_g, out.fat_g)
  ) {
    out.needs_review = true;
  }
  return out;
}

/** Límite en memoria de USDA: 900 peticiones por hora (por instancia). */
export class RateLimiter {
  private hits: number[] = [];
  constructor(
    private max = 900,
    private windowMs = 3_600_000,
  ) {}
  take(now = Date.now()): boolean {
    this.hits = this.hits.filter((t) => now - t < this.windowMs);
    if (this.hits.length >= this.max) return false;
    this.hits.push(now);
    return true;
  }
}

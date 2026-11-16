/**
 * Formato de intercambio v1 (TRD §8, Backend Schema §8).
 * Estricto en los tipos, tolerante con las claves desconocidas (se ignoran con un aviso).
 */
import { z } from 'zod';

export const MAX_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCTS = 2000;

/** Número o cadena numérica con coma o punto decimal ("3,5"). */
const num = z.union([z.number(), z.string()]).transform((v, ctx) => {
  // z.number() ya rechaza NaN e Infinity.
  if (typeof v === 'number') return v;
  const s = v.trim().replace(',', '.');
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  ctx.addIssue({ code: 'custom', message: 'Debe ser un número' });
  return z.NEVER;
});

const nonNeg = (max: number) =>
  num.pipe(z.number().min(0, 'No puede ser negativo').max(max, `Debe ser ≤ ${max}`));

const nutrient = nonNeg(100).nullable();

export const nutrientsSchema = z.looseObject({
  energy_kcal: nonNeg(900).nullable(),
  protein_g: nutrient,
  carbs_g: nutrient,
  sugars_g: nutrient,
  fat_g: nutrient,
  saturated_fat_g: nutrient,
  fiber_g: nutrient,
  salt_g: nutrient,
});

export const portionSchema = z.looseObject({
  name: z.string().trim().min(1).max(60),
  amount: num.pipe(z.number().positive('Debe ser mayor que 0')),
  estimated: z.boolean().optional().default(false),
});

const PRODUCT_SOURCES = [
  'etiqueta',
  'web',
  'estimado',
  'openfoodfacts',
  'usda',
  'manual',
  'receta',
  'aesan',
  'seed',
] as const;

export const productSchema = z.looseObject({
  name: z.string().trim().min(1, 'Obligatorio').max(200),
  brand: z.string().trim().nullable().optional().default(null),
  barcode: z
    .string()
    .trim()
    .regex(/^[0-9]{6,14}$/, 'Código de barras de 6 a 14 dígitos')
    .nullable()
    .optional()
    .default(null),
  category: z.string().trim().nullable().optional().default(null),
  base_unit: z.enum(['g', 'ml']),
  package_size: num.pipe(z.number().positive()).nullable().optional().default(null),
  nutrients_per_100: nutrientsSchema,
  portions: z.array(portionSchema).optional().default([]),
  supermarkets: z.array(z.string().trim().min(1).max(60)).optional().default([]),
  source: z.enum(PRODUCT_SOURCES),
  confidence: z.enum(['alta', 'media', 'baja']).nullable().optional().default(null),
  warnings: z.array(z.string()).optional().default([]),
  // Campos opcionales de la copia de seguridad
  id: z.uuid().optional(),
  favorite: z.boolean().optional(),
  manually_edited: z.boolean().optional(),
  needs_review: z.boolean().optional(),
  source_id: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  supermarket_prices: z
    .array(
      z.looseObject({ name: z.string().min(1), price: num.pipe(z.number().min(0)).nullable() }),
    )
    .optional(),
});

/** Claves de la copia de seguridad; su forma detallada se valida en la restauración (tarea 11.2). */
const backupArray = z.array(z.record(z.string(), z.unknown()));

export const interchangeSchema = z
  .looseObject({
    schema_version: z.literal(1, 'schema_version debe ser 1'),
    exported_at: z.string().optional(),
    products: z
      .array(productSchema)
      .max(MAX_PRODUCTS, `Máximo ${MAX_PRODUCTS} productos`)
      .optional(),
    supermarkets: backupArray.optional(),
    recipes: backupArray.optional(),
    saved_meals: backupArray.optional(),
    meal_slots: backupArray.optional(),
    diary: backupArray.optional(),
    day_flags: backupArray.optional(),
    weights: backupArray.optional(),
    daily_activity: backupArray.optional(),
    tdee_history: backupArray.optional(),
    profile: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((v) => Object.keys(v).some((k) => k !== 'schema_version' && k !== 'exported_at'), {
    message: 'El archivo no contiene datos',
  });

export type Product = z.output<typeof productSchema>;
export type Interchange = z.output<typeof interchangeSchema>;

export interface FieldError {
  path: string;
  message: string;
}

export type ParseResult =
  | { ok: true; data: Interchange; kind: 'products' | 'backup'; warnings: string[] }
  | { ok: false; errors: FieldError[] };

/** ['products', 3, 'nutrients_per_100', 'fat_g'] → 'products[3].nutrients_per_100.fat_g' */
export function formatPath(path: ReadonlyArray<PropertyKey>): string {
  return path.reduce<string>((acc, seg) => {
    if (typeof seg === 'number') return `${acc}[${seg}]`;
    return acc ? `${acc}.${String(seg)}` : String(seg);
  }, '');
}

const KNOWN = {
  root: Object.keys(interchangeSchema.shape),
  product: Object.keys(productSchema.shape),
  nutrients: Object.keys(nutrientsSchema.shape),
  portion: Object.keys(portionSchema.shape),
};

function unknownKeys(obj: object, known: string[], at: string): string[] {
  return Object.keys(obj)
    .filter((k) => !known.includes(k))
    .map((k) => `Clave desconocida ignorada: ${at ? `${at}.` : ''}${k}`);
}

function collectWarnings(raw: Record<string, unknown>, data: Interchange): string[] {
  const out = unknownKeys(raw, KNOWN.root, '');
  const rawProducts = Array.isArray(raw.products) ? raw.products : [];
  data.products?.forEach((_, i) => {
    const p = rawProducts[i] as Record<string, unknown>;
    out.push(...unknownKeys(p, KNOWN.product, `products[${i}]`));
    out.push(
      ...unknownKeys(
        p.nutrients_per_100 as object,
        KNOWN.nutrients,
        `products[${i}].nutrients_per_100`,
      ),
    );
    const portions = Array.isArray(p.portions) ? (p.portions as object[]) : [];
    portions.forEach((po, j) =>
      out.push(...unknownKeys(po, KNOWN.portion, `products[${i}].portions[${j}]`)),
    );
  });
  return out;
}

/** Quita las claves desconocidas del resultado validado. */
function strip<T extends object>(obj: T, known: string[]): T {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => known.includes(k))) as T;
}

export function parseInterchange(input: unknown): ParseResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: [{ path: '', message: 'Se esperaba un objeto JSON' }] };
  }
  const r = interchangeSchema.safeParse(input);
  if (!r.success) {
    return {
      ok: false,
      errors: r.error.issues.map((i) => ({ path: formatPath(i.path), message: i.message })),
    };
  }
  const warnings = collectWarnings(input as Record<string, unknown>, r.data);
  const data = strip(r.data, KNOWN.root);
  if (data.products) {
    data.products = data.products.map((p) => ({
      ...strip(p, KNOWN.product),
      nutrients_per_100: strip(p.nutrients_per_100, KNOWN.nutrients),
      portions: p.portions.map((po) => strip(po, KNOWN.portion)),
    }));
  }
  const kind = Object.keys(data).every((k) =>
    ['schema_version', 'exported_at', 'products'].includes(k),
  )
    ? 'products'
    : 'backup';
  return { ok: true, data, kind, warnings };
}

/** Entrada de texto (pegado o archivo): límite de 5 MB y JSON válido. */
export function parseInterchangeText(text: string): ParseResult {
  if (new TextEncoder().encode(text).length > MAX_BYTES) {
    return { ok: false, errors: [{ path: '', message: 'El archivo supera 5 MB' }] };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return {
      ok: false,
      errors: [{ path: '', message: `JSON no válido: ${(e as Error).message}` }],
    };
  }
  return parseInterchange(json);
}

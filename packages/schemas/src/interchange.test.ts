import { describe, expect, it } from 'vitest';
import { formatPath, MAX_PRODUCTS, parseInterchange, parseInterchangeText } from './interchange';

/** Ejemplo con la forma que genera la IA (formato del usuario). */
const example = {
  schema_version: 1,
  products: [
    {
      name: 'Yogur natural',
      brand: 'Hacendado',
      barcode: '8480000123456',
      category: 'Lácteos',
      base_unit: 'g',
      package_size: 500,
      nutrients_per_100: {
        energy_kcal: 61,
        protein_g: '3,6',
        carbs_g: 4.7,
        sugars_g: 4.7,
        fat_g: 3.1,
        saturated_fat_g: 2.0,
        fiber_g: null,
        salt_g: '0.13',
      },
      portions: [{ name: '1 yogur', amount: 125, estimated: false }],
      supermarkets: ['Mercadona'],
      source: 'etiqueta',
      confidence: 'alta',
      warnings: [],
    },
  ],
};

const clone = () => structuredClone(example) as typeof example & Record<string, unknown>;

describe('formato de intercambio v1', () => {
  it('valida el ejemplo y convierte la coma decimal', () => {
    const r = parseInterchange(example);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.kind).toBe('products');
    expect(r.warnings).toEqual([]);
    const p = r.data.products![0]!;
    expect(p.nutrients_per_100.protein_g).toBe(3.6);
    expect(p.nutrients_per_100.salt_g).toBe(0.13);
    expect(p.nutrients_per_100.fiber_g).toBeNull();
  });

  it('aplica valores por defecto a los campos opcionales', () => {
    const r = parseInterchange({
      schema_version: 1,
      products: [
        {
          name: 'Leche',
          base_unit: 'ml',
          nutrients_per_100: {
            energy_kcal: 46,
            protein_g: 3.1,
            carbs_g: 4.8,
            sugars_g: 4.8,
            fat_g: 1.6,
            saturated_fat_g: 1,
            fiber_g: 0,
            salt_g: 0.1,
          },
          portions: [{ name: 'vaso', amount: 250 }],
          source: 'estimado',
        },
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const p = r.data.products![0]!;
    expect(p).toMatchObject({ brand: null, barcode: null, supermarkets: [], warnings: [] });
    expect(p.portions[0]!.estimated).toBe(false);
  });

  it('los errores llevan la ruta del campo', () => {
    const bad = clone();
    bad.products.push({
      ...bad.products[0]!,
      name: '',
      nutrients_per_100: { ...bad.products[0]!.nutrients_per_100 },
    });
    (bad.products[1]!.nutrients_per_100 as Record<string, unknown>).fat_g = 'mucho';
    const r = parseInterchange(bad);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const paths = r.errors.map((e) => e.path);
    expect(paths).toContain('products[1].name');
    expect(paths).toContain('products[1].nutrients_per_100.fat_g');
  });

  it('rechaza rangos, enums y códigos de barras inválidos', () => {
    const bad = clone();
    const p = bad.products[0]!;
    p.nutrients_per_100 = { ...p.nutrients_per_100, energy_kcal: 950, protein_g: '-1' };
    p.barcode = '12ab';
    (p as Record<string, unknown>).source = 'inventado';
    p.portions = [{ name: 'x', amount: 0, estimated: false }];
    (p as Record<string, unknown>).package_size = Number.POSITIVE_INFINITY;
    const r = parseInterchange(bad);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const paths = r.errors.map((e) => e.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        'products[0].nutrients_per_100.energy_kcal',
        'products[0].nutrients_per_100.protein_g',
        'products[0].barcode',
        'products[0].source',
        'products[0].portions[0].amount',
        'products[0].package_size',
      ]),
    );
  });

  it('claves desconocidas: aviso y se eliminan', () => {
    const extra = clone();
    extra.foo = 1;
    const p = extra.products[0]! as Record<string, unknown>;
    p.color = 'rojo';
    (p.nutrients_per_100 as Record<string, unknown>).vitamin_c = 3;
    (p.portions as Record<string, unknown>[])[0]!.peso = 1;
    const r = parseInterchange(extra);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.warnings).toEqual([
      'Clave desconocida ignorada: foo',
      'Clave desconocida ignorada: products[0].color',
      'Clave desconocida ignorada: products[0].nutrients_per_100.vitamin_c',
      'Clave desconocida ignorada: products[0].portions[0].peso',
    ]);
    expect('foo' in r.data).toBe(false);
    expect('color' in r.data.products![0]!).toBe(false);
  });

  it('producto sin porciones no genera avisos de porciones', () => {
    const e = clone();
    delete (e.products[0] as Record<string, unknown>).portions;
    const r = parseInterchange(e);
    expect(r.ok && r.warnings).toEqual([]);
  });

  it('distingue importación de productos y copia de seguridad', () => {
    const r = parseInterchange({ schema_version: 1, weights: [{ day: '2026-11-01' }] });
    expect(r.ok && r.kind).toBe('backup');
  });

  it('rechaza versión, archivo vacío, no-objetos y exceso de productos', () => {
    expect(parseInterchange({ ...example, schema_version: 2 }).ok).toBe(false);
    expect(parseInterchange({ schema_version: 1 }).ok).toBe(false);
    expect(parseInterchange([]).ok).toBe(false);
    expect(parseInterchange(null).ok).toBe(false);
    const many = { schema_version: 1, products: Array(MAX_PRODUCTS + 1).fill(example.products[0]) };
    const r = parseInterchange(many);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]!.path).toBe('products');
  });
});

describe('entrada de texto', () => {
  it('JSON válido', () => {
    expect(parseInterchangeText(JSON.stringify(example)).ok).toBe(true);
  });
  it('JSON mal formado conserva un error legible', () => {
    const r = parseInterchangeText('{ "schema_version": 1, ');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]!.message).toMatch(/^JSON no válido/);
  });
  it('límite de 5 MB', () => {
    const r = parseInterchangeText(' '.repeat(5 * 1024 * 1024 + 1));
    expect(r.ok).toBe(false);
  });
});

describe('formatPath', () => {
  it('formatea rutas', () => {
    expect(formatPath(['products', 3, 'nutrients_per_100', 'fat_g'])).toBe(
      'products[3].nutrients_per_100.fat_g',
    );
    expect(formatPath([])).toBe('');
  });
});

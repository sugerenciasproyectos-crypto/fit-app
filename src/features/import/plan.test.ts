import { describe, expect, it } from 'vitest';
import { parseInterchange, type Product } from '../../../packages/schemas/src';
import {
  buildPayload,
  findDuplicate,
  initialRows,
  isEstimated,
  needsReview,
  normKey,
  summary,
  unknownSupermarkets,
} from './plan';

function product(over: Record<string, unknown> = {}): Product {
  const r = parseInterchange({
    schema_version: 1,
    products: [
      {
        name: 'Yogur Natural',
        brand: 'Hacendado',
        barcode: '8480000123456',
        base_unit: 'g',
        nutrients_per_100: {
          energy_kcal: 61,
          protein_g: 3.6,
          carbs_g: 4.7,
          sugars_g: 4.7,
          fat_g: 3.1,
          saturated_fat_g: 2,
          fiber_g: null,
          salt_g: 0.13,
        },
        portions: [{ name: 'yogur', amount: 125 }],
        supermarkets: ['Mercadona'],
        source: 'etiqueta',
        confidence: 'alta',
        ...over,
      },
    ],
  });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.data.products![0]!;
}

const existing = [
  { id: 'e1', name: 'Otro', brand: null, barcode: '8480000123456' },
  { id: 'e2', name: 'Yógur  natural', brand: 'HACENDADO', barcode: null },
];

describe('importación', () => {
  it('normaliza nombre y marca', () => {
    expect(normKey('Yógur  Natural', 'HACENDADO')).toBe('yogur natural hacendado');
  });
  it('duplicado: primero por código, luego por nombre y marca', () => {
    expect(findDuplicate(product(), existing)).toEqual({ id: 'e1', name: 'Otro', by: 'barcode' });
    expect(findDuplicate(product({ barcode: null }), existing)).toEqual({
      id: 'e2',
      name: 'Yógur  natural',
      by: 'nombre',
    });
    expect(findDuplicate(product({ barcode: null, name: 'Kéfir' }), existing)).toBeNull();
  });
  it('revisión: confianza baja, estimado o kcal incoherentes', () => {
    expect(needsReview(product())).toBe(false);
    expect(needsReview(product({ confidence: 'baja' }))).toBe(true);
    expect(needsReview(product({ source: 'estimado' }))).toBe(true);
    expect(isEstimated(product({ portions: [{ name: 'x', amount: 1, estimated: true }] }))).toBe(
      true,
    );
    expect(isEstimated(product())).toBe(false);
  });
  it('supermercados desconocidos, sin duplicar', () => {
    const ps = [
      product({ supermarkets: ['Mercadona', 'Lidl'] }),
      product({ supermarkets: ['LIDL'] }),
    ];
    expect(unknownSupermarkets(ps, ['mercadona'])).toEqual(['LIDL']);
  });
  it('payload y decisiones', () => {
    const rows = initialRows([product(), product({ barcode: null, name: 'Kéfir' })], existing);
    expect(rows.map((r) => r.action)).toEqual(['update', 'new']);
    rows[0]!.action = 'merge';
    const { payload, decisions } = buildPayload(rows, ['Lidl']);
    expect(decisions).toEqual([
      { index: 0, action: 'merge', target: 'e1' },
      { index: 1, action: 'new', target: null },
    ]);
    expect(payload.new_supermarkets).toEqual(['Lidl']);
    expect(payload.products[0]!.needs_review).toBe(false);
    rows[1]!.action = 'skip';
    expect(summary(rows)).toEqual({ imported: 1, skipped: 1 });
  });
});

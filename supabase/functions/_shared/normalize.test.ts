import { describe, expect, it } from 'vitest';
import { normalizeOff, normalizeUsda, RateLimiter } from './normalize';

const off = (product: Record<string, unknown>, status = 1) => ({
  status,
  code: '8480000123456',
  product: { code: '8480000123456', ...product },
});

describe('Open Food Facts', () => {
  it('normal: kcal por 100 g, sal, tiendas y marca', () => {
    const p = normalizeOff(
      off({
        product_name_es: 'Yogur natural',
        brands: 'Hacendado, Mercadona',
        product_quantity: '500',
        product_quantity_unit: 'g',
        stores: 'Mercadona',
        categories_tags: ['en:dairies', 'en:yogurts'],
        nutriments: {
          'energy-kcal_100g': 61,
          proteins_100g: 3.6,
          carbohydrates_100g: 4.7,
          sugars_100g: 4.7,
          fat_100g: 3.1,
          'saturated-fat_100g': 2,
          salt_100g: 0.13,
        },
      }),
    )!;
    expect(p).toMatchObject({
      name: 'Yogur natural',
      brand: 'Hacendado',
      barcode: '8480000123456',
      base_unit: 'g',
      package_size: 500,
      energy_kcal: 61,
      fiber_g: null,
      salt_g: 0.13,
      category: 'yogurts',
      suggested_stores: ['Mercadona'],
      needs_review: false,
    });
  });

  it('status 0: no encontrado aunque sea HTTP 200', () => {
    expect(normalizeOff({ status: 0, status_verbose: 'product not found' })).toBeNull();
  });

  it('solo kJ: convierte ÷ 4,184 y avisa', () => {
    const p = normalizeOff(
      off({
        product_name: 'Galletas',
        nutriments: { energy_100g: 1966, proteins_100g: 7, carbohydrates_100g: 70, fat_100g: 17 },
      }),
    )!;
    expect(p.energy_kcal).toBeCloseTo(469.89, 2);
    expect(p.warnings).toContain('Energía convertida desde kJ');
    expect(p.needs_review).toBe(false);
  });

  it('solo por ración: escala a 100', () => {
    const p = normalizeOff(
      off({
        product_name: 'Barrita',
        serving_quantity: 40,
        nutriments: {
          'energy-kcal_serving': 160,
          proteins_serving: 8,
          carbohydrates_serving: 20,
          fat_serving: 5,
        },
      }),
    )!;
    expect(p.energy_kcal).toBe(400);
    expect(p.protein_g).toBe(20);
    expect(p.warnings).toContain('Valores calculados desde la ración');
  });

  it('incoherente: marca revisión', () => {
    const p = normalizeOff(
      off({
        product_name: 'Raro',
        nutriments: {
          'energy-kcal_100g': 100,
          proteins_100g: 20,
          carbohydrates_100g: 30,
          fat_100g: 10,
        },
      }),
    )!;
    expect(p.needs_review).toBe(true);
  });

  it('bebida en litros: ml y envase en ml; sin energía → revisión', () => {
    const p = normalizeOff(
      off({
        product_name: 'Agua',
        product_quantity: '1.5',
        product_quantity_unit: 'l',
        nutriments: {},
      }),
    )!;
    expect(p.base_unit).toBe('ml');
    expect(p.package_size).toBe(1500);
    expect(p.energy_kcal).toBeNull();
    expect(p.needs_review).toBe(true);
  });

  it('valores fuera de rango o contradictorios se descartan; sin nombre usa el código', () => {
    const p = normalizeOff(
      off({
        nutriments: {
          'energy-kcal_100g': 0,
          proteins_100g: 0,
          carbohydrates_100g: 2,
          sugars_100g: 9,
          fat_100g: 1,
          'saturated-fat_100g': 5,
          salt_100g: 150,
        },
      }),
    )!;
    expect(p.name).toBe('Producto 8480000123456');
    expect(p.sugars_g).toBeNull();
    expect(p.saturated_fat_g).toBeNull();
    expect(p.salt_g).toBeNull();
    expect(p.needs_review).toBe(true);
  });
});

describe('USDA', () => {
  it('mapea por nutrientNumber y convierte sodio a sal', () => {
    const p = normalizeUsda({
      fdcId: 171705,
      description: 'Oats',
      foodCategory: 'Cereal Grains and Pasta',
      foodNutrients: [
        { nutrientNumber: '208', value: 379 },
        { nutrientNumber: '203', value: 13.2 },
        { nutrientNumber: '204', value: 6.5 },
        { nutrientNumber: '205', value: 67.7 },
        { nutrientNumber: '291', value: 10.1 },
        { nutrientNumber: '269', value: 1 },
        { nutrientNumber: '606', value: 1.1 },
        { nutrientNumber: '307', value: 6 },
        { nutrientNumber: '999', value: null },
      ],
    });
    expect(p).toMatchObject({
      name: 'Oats',
      source: 'usda',
      source_id: '171705',
      base_unit: 'g',
      energy_kcal: 379,
      salt_g: 0.02,
      needs_review: false,
    });
  });
  it('Foundation: energía Atwater (957) si falta la 208', () => {
    const p = normalizeUsda({
      fdcId: 2,
      description: 'Oats, puffed',
      foodNutrients: [
        { nutrientNumber: '957', value: 380 },
        { nutrientNumber: '958', value: 390 },
      ],
    });
    expect(p.energy_kcal).toBe(380);
  });
  it('sin energía o sin nutrientes → revisión', () => {
    const p = normalizeUsda({ fdcId: 1, description: 'X' });
    expect(p.energy_kcal).toBeNull();
    expect(p.salt_g).toBeNull();
    expect(p.needs_review).toBe(true);
  });
});

describe('límite de USDA', () => {
  it('deja pasar hasta el máximo por ventana', () => {
    const r = new RateLimiter(2, 1000);
    expect(r.take(0)).toBe(true);
    expect(r.take(1)).toBe(true);
    expect(r.take(2)).toBe(false);
    expect(r.take(1500)).toBe(true);
  });
});

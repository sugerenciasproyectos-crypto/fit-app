import { describe, expect, it } from 'vitest';
import {
  dbErrorToField,
  emptyProductDraft,
  toPatch,
  validateProduct,
  type ProductDraft,
} from './form';

const base = (): ProductDraft => {
  const d = emptyProductDraft();
  d.name = 'Yogur';
  d.nutrients.energy_kcal = '61';
  d.nutrients.carbs_g = '4,7';
  d.nutrients.sugars_g = '4,7';
  return d;
};

describe('formulario de producto', () => {
  it('válido y con coma decimal', () => {
    const d = base();
    d.portions = [{ name: 'yogur', amount: '125' }];
    expect(validateProduct(d)).toEqual({});
    const { patch, portions } = toPatch(d, true);
    expect(patch.carbs_g).toBe(4.7);
    expect(patch.fat_g).toBeNull();
    expect(patch.manually_edited).toBe(true);
    expect(portions).toEqual([{ name: 'yogur', amount: 125 }]);
    expect(toPatch(d, false).patch.manually_edited).toBeUndefined();
  });
  it('errores por campo', () => {
    const d = base();
    d.name = '';
    d.barcode = '12ab';
    d.package_size = '0';
    d.nutrients.energy_kcal = '950';
    d.nutrients.sugars_g = '10';
    d.nutrients.fat_g = '2';
    d.nutrients.saturated_fat_g = '5';
    d.portions = [
      { name: 'x', amount: '0' },
      { name: 'X', amount: '10' },
      { name: '', amount: '1' },
    ];
    expect(Object.keys(validateProduct(d)).sort()).toEqual(
      [
        'barcode',
        'name',
        'nutrients.energy_kcal',
        'nutrients.saturated_fat_g',
        'nutrients.sugars_g',
        'package_size',
        'portions.0.amount',
        'portions.1.name',
        'portions.2.name',
      ].sort(),
    );
  });
  it('errores de la base a campos', () => {
    expect(
      dbErrorToField('duplicate key value violates unique constraint "products_barcode_uq"'),
    ).toHaveProperty('barcode');
    expect(
      dbErrorToField('new row violates check constraint "products_fat_g_check"'),
    ).toHaveProperty('nutrients.fat_g');
    expect(dbErrorToField('violates check constraint "sugar_le_carbs"')).toHaveProperty(
      'nutrients.sugars_g',
    );
    expect(dbErrorToField('violates check constraint "sat_le_fat"')).toHaveProperty(
      'nutrients.saturated_fat_g',
    );
    expect(dbErrorToField('portions_product_id_name_key')).toHaveProperty('portions');
    expect(dbErrorToField('otro')).toEqual({ form: 'otro' });
  });
});

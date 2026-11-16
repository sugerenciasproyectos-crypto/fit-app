import { unzipSync, strFromU8 } from 'fflate';
import { describe, expect, it } from 'vitest';
import { backupToZip, cell, toCsv } from './csv';
import type { Backup } from './export';

describe('CSV para Excel en español', () => {
  it('BOM, punto y coma, coma decimal y comillas', () => {
    const csv = toCsv([{ name: 'Plátano; maduro', kcal: 89.5, fav: true, n: null }]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('name;kcal;fav;n\r\n');
    expect(csv).toContain('"Plátano; maduro";89,5;sí;\r\n');
    expect(cell('dijo "hola"')).toBe('"dijo ""hola"""');
    expect(cell('a"b;c')).toBe('"a""b;c"');
    expect(cell({ a: 1 })).toBe('"{""a"":1}"');
  });

  it('el zip lleva un CSV por tabla', () => {
    const b = {
      schema_version: 1,
      exported_at: '',
      meal_slots: [],
      supermarkets: [{ id: 's', name: 'Mercadona' }],
      products: [
        {
          id: 'p',
          name: 'Avena',
          brand: null,
          barcode: null,
          category: null,
          base_unit: 'g',
          package_size: null,
          nutrients_per_100: { energy_kcal: 379 },
          portions: [],
          supermarkets: ['Mercadona'],
          supermarket_prices: [],
          source: 'manual',
          source_id: null,
          confidence: null,
          warnings: [],
          favorite: false,
          manually_edited: false,
          needs_review: false,
          deleted_at: null,
          created_at: '',
          updated_at: '',
        },
      ],
      recipes: [],
      saved_meals: [],
      diary: [],
      day_flags: [],
      weights: [{ id: 'w', day: '2026-11-16', weight_kg: 78.4, source: 'manual', measured_at: '' }],
      daily_activity: [],
      tdee_history: [],
    } as unknown as Backup;
    const files = unzipSync(backupToZip(b));
    expect(Object.keys(files).sort()).toEqual([
      'daily_activity.csv',
      'diary.csv',
      'products.csv',
      'supermarkets.csv',
      'tdee_history.csv',
      'weights.csv',
    ]);
    expect(strFromU8(files['weights.csv']!)).toContain('2026-11-16;78,4;manual');
  });
});

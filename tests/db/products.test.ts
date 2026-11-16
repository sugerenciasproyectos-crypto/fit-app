import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { signIn, type Client } from './client';

let db: Client;
let uid: string;
const created: string[] = [];

beforeAll(async () => {
  ({ db, id: uid } = await signIn('A'));
  const { data, error } = await db
    .from('products')
    .insert([
      {
        user_id: uid,
        name: 'Yogur natural',
        brand: 'Hacendado',
        barcode: '8480000123456',
        source: 'etiqueta',
        energy_kcal: 61,
      },
      {
        user_id: uid,
        name: 'Producto borrado de prueba',
        source: 'manual',
        deleted_at: new Date().toISOString(),
      },
    ])
    .select('id');
  if (error) throw error;
  created.push(...data.map((d) => d.id));
});

afterAll(async () => {
  await db.from('products').delete().in('id', created);
});

describe('3.1 seed', () => {
  it('el usuario tiene el catálogo con porciones', async () => {
    const { count } = await db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('source', 'seed');
    expect(count).toBeGreaterThanOrEqual(150);
    const { data } = await db
      .from('products')
      .select('name, portions!portions_product_id_fkey(name, amount)')
      .eq('source_id', 'seed:avena')
      .single();
    expect(data?.portions.length).toBeGreaterThan(0);
  });
});

describe('3.2 search_products', () => {
  const search = (q: string, extra: Record<string, unknown> = {}) =>
    db.rpc('search_products', { q, ...extra });

  it('"yogur hacendado" encuentra el producto (nombre + marca)', async () => {
    const { data, error } = await search('yogur hacendado');
    expect(error).toBeNull();
    expect(data?.[0]?.brand).toBe('Hacendado');
  });

  it('ignora tildes y mayúsculas', async () => {
    const { data } = await search('PLATANO');
    expect(data?.some((p) => p.name === 'Plátano')).toBe(true);
  });

  it('el código de barras es coincidencia exacta y va primero', async () => {
    const { data } = await search('8480000123456');
    expect(data?.[0]?.barcode).toBe('8480000123456');
  });

  it('tolera erratas', async () => {
    const { data } = await search('almendaras');
    expect(data?.some((p) => p.name === 'Almendras')).toBe(true);
  });

  it('no devuelve productos borrados', async () => {
    const { data } = await search('borrado de prueba');
    expect(data).toEqual([]);
  });

  it('solo favoritos', async () => {
    const { data } = await search('', { only_fav: true });
    expect(data?.every((p) => p.favorite)).toBe(true);
  });

  it('responde en 300 ms o menos (mediana de 5)', async () => {
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t = performance.now();
      await search('leche');
      times.push(performance.now() - t);
    }
    times.sort((a, b) => a - b);
    expect(times[2]).toBeLessThanOrEqual(300);
  });
});

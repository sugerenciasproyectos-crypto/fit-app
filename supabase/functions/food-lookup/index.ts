// Edge Function food-lookup (TRD §6, Backend Schema §7).
// POST { action: 'barcode', code } → { found, product?, raw? }
// POST { action: 'search', q }     → { results: Normalized[] }   (USDA, clave en secrets)
import { normalizeOff, normalizeUsda, RateLimiter } from '../_shared/normalize.ts';

const UA = 'AppCalorias/0.1 (uso personal)';
const OFF_FIELDS =
  'code,product_name,product_name_es,brands,categories_tags,quantity,product_quantity,product_quantity_unit,nutriments,serving_quantity,stores';
const usdaLimit = new RateLimiter(900);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

/** Timeout de 5 s y un reintento. */
async function fetchRetry(url: string, init: RequestInit = {}): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(url, { ...init, signal: AbortSignal.timeout(5000) });
      if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  let body: { action?: string; code?: string; q?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON no válido' }, 400);
  }

  try {
    if (body.action === 'barcode') {
      const code = String(body.code ?? '').replace(/\D/g, '');
      if (!/^\d{6,14}$/.test(code)) return json({ error: 'Código no válido' }, 400);
      const r = await fetchRetry(
        `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`,
        { headers: { 'User-Agent': UA } },
      );
      if (r.status === 404) return json({ found: false });
      const raw = await r.json();
      const product = normalizeOff(raw);
      return json(product ? { found: true, product, raw: raw.product } : { found: false });
    }

    if (body.action === 'search') {
      const q = String(body.q ?? '').trim();
      if (q.length < 2) return json({ results: [] });
      const key = Deno.env.get('USDA_API_KEY');
      if (!key) return json({ error: 'Falta USDA_API_KEY en los secrets' }, 503);
      if (!usdaLimit.take())
        return json({ error: 'Límite de USDA alcanzado; prueba más tarde' }, 429);
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&dataType=Foundation,SR%20Legacy&pageSize=20&api_key=${key}`;
      const r = await fetchRetry(url);
      if (!r.ok) return json({ error: `USDA respondió ${r.status}` }, 502);
      const data = await r.json();
      const results = ((data.foods ?? []) as Record<string, unknown>[]).map(normalizeUsda);
      return json({ results });
    }

    return json({ error: 'Acción desconocida' }, 400);
  } catch (e) {
    return json({ error: `No se pudo consultar: ${(e as Error).message}` }, 502);
  }
});

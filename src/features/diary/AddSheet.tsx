import { ScanBarcode, Search } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { fmtKcal, fmtQty } from '../../lib/format';
import { savedMealKcal, useSavedMeals, type SavedMealWithItems } from '../meals/api';
import { supabase } from '../../lib/supabase';
import { Button } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { useUserId } from '../auth/useAuth';
import { searchUsda, upsertExternal, type Normalized } from '../external/cache';
import { useSupermarkets } from '../supermarkets/api';
import { productsKey, useProductSearch, type Product } from '../products/api';
import type { MealSlot } from './api';

type Tab = 'recientes' | 'favoritos' | 'guardadas';

function quickLabel(p: Product): string {
  return p.last_portion_id
    ? `${fmtQty(p.last_quantity ?? 1)} porción`
    : `${fmtQty(p.last_quantity ?? 0)} ${p.base_unit}`;
}

/** H1 Añadir: búsqueda local, selector de comida y pestañas Recientes · Favoritos. */
export function AddSheet({
  slots,
  slotId,
  onSlot,
  onPick,
  onQuick,
  onSavedMeal,
  onClose,
}: {
  slots: MealSlot[];
  slotId: string;
  onSlot: (id: string) => void;
  onPick: (p: Product) => void;
  onQuick?: (p: Product) => void;
  onSavedMeal?: (m: SavedMealWithItems) => void;
  onClose: () => void;
}) {
  const meals = useSavedMeals();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('recientes');
  const [market, setMarket] = useState('');
  const markets = useSupermarkets();
  const deferred = useDeferredValue(q.trim());
  const searching = deferred.length > 0;
  const { data, isLoading, error } = useProductSearch({
    q: deferred,
    onlyFav: !searching && tab === 'favoritos',
    supermarket: market || null,
    limit: searching ? 40 : 200,
  });
  const list = searching
    ? data
    : tab === 'recientes'
      ? data
          ?.filter((p) => p.last_used_at)
          .sort((x, y) => y.last_used_at!.localeCompare(x.last_used_at!))
          .slice(0, 25)
      : data;

  const userId = useUserId();
  const qc = useQueryClient();
  const [ext, setExt] = useState<{
    q: string;
    results: Normalized[] | null;
    busy: boolean;
    error: string | null;
  }>({ q: '', results: null, busy: false, error: null });
  if (ext.q !== deferred && (ext.results || ext.error))
    setExt({ q: deferred, results: null, busy: false, error: null });

  async function searchExternal() {
    setExt({ q: deferred, results: null, busy: true, error: null });
    try {
      const results = await searchUsda(supabase, deferred);
      setExt({ q: deferred, results, busy: false, error: null });
    } catch (e) {
      setExt({ q: deferred, results: null, busy: false, error: (e as Error).message });
    }
  }

  async function pickExternal(n: Normalized) {
    setExt((s) => ({ ...s, busy: true }));
    try {
      const product = await upsertExternal(supabase, userId, n, null);
      void qc.invalidateQueries({ queryKey: productsKey });
      onPick(product);
    } catch (e) {
      setExt((s) => ({ ...s, busy: false, error: (e as Error).message }));
    }
  }

  return (
    <Sheet title="Añadir" onClose={onClose} tall>
      <div className="sticky top-0 z-10 grid gap-2 bg-paper pb-2">
        <div className="flex gap-2">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded border border-rule px-3">
            <Search size={18} strokeWidth={1.5} aria-hidden className="text-ink-2" />
            <span className="sr-only">Buscar</span>
            <input
              data-autofocus
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar alimento o código"
              className="min-h-11 flex-1 bg-transparent outline-none"
            />
          </label>
          <Link
            to="/escanear"
            aria-label="Escanear código de barras"
            className="grid size-11 place-items-center rounded border border-rule"
          >
            <ScanBarcode size={20} strokeWidth={1.5} />
          </Link>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-2">→</span>
          <span className="sr-only">Comida</span>
          <select
            value={slotId}
            onChange={(e) => onSlot(e.target.value)}
            className="min-h-11 rounded-full border border-ink bg-paper px-3 font-semibold"
          >
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {(markets.data?.length ?? 0) > 0 && (
          <select
            aria-label="Supermercado"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="min-h-11 w-fit rounded-full border border-rule bg-paper px-3 text-sm"
          >
            <option value="">Súper: todos</option>
            {markets.data!.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        {!searching && (
          <div role="tablist" className="flex gap-4 text-sm">
            {(['recientes', 'favoritos', 'guardadas'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`min-h-11 capitalize ${tab === t ? 'text-ink underline underline-offset-4' : 'text-ink-2'}`}
              >
                {t === 'guardadas' ? 'Comidas guardadas' : t}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-alert">No se pudo buscar: {error.message}</p>}
      {!searching && tab === 'guardadas' ? (
        meals.data && meals.data.length > 0 ? (
          <ul className="divide-y divide-dashed divide-rule">
            {meals.data.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onSavedMeal?.(m)}
                  className="flex min-h-12 w-full items-baseline gap-1 py-2 text-left"
                >
                  <span className="min-w-0 truncate">
                    {m.name}
                    <span className="block text-xs text-ink-2">
                      {m.items.length} alimentos · 1 toque
                    </span>
                  </span>
                  <span aria-hidden className="leader min-w-4 flex-1" />
                  <span className="num shrink-0">{fmtKcal(savedMealKcal(m))}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-2 py-6 text-center">
            <p className="text-ink-2">Aún no hay comidas guardadas.</p>
            <Link to="/productos/comidas/nueva" className="text-action underline">
              Crear comida guardada
            </Link>
          </div>
        )
      ) : isLoading ? (
        <p className="py-4 text-ink-2">Buscando…</p>
      ) : list && list.length > 0 ? (
        <ul className="divide-y divide-dashed divide-rule">
          {list.map((p) => {
            const quick = !searching && onQuick && p.last_quantity != null;
            return (
              <li key={p.id} className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => (quick ? onQuick(p) : onPick(p))}
                  className="flex min-h-12 min-w-0 flex-1 items-baseline gap-1 py-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{p.name}</span>
                    <span className="block truncate text-xs text-ink-2">
                      {quick ? `↵ 1 toque · ${quickLabel(p)}` : (p.brand ?? '')}
                    </span>
                  </span>
                  <span aria-hidden className="leader min-w-4 flex-1" />
                  <span className="num shrink-0">
                    {p.energy_kcal == null ? '—' : fmtKcal(p.energy_kcal)}
                    <span className="text-xs text-ink-2">/100{p.base_unit}</span>
                  </span>
                </button>
                {quick && (
                  <button
                    type="button"
                    aria-label={`Elegir cantidad de ${p.name}`}
                    onClick={() => onPick(p)}
                    className="ml-1 grid w-11 place-items-center text-ink-2"
                  >
                    ⋯
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid gap-3 py-6 text-center">
          <p className="text-ink-2">
            {searching
              ? ext.results
                ? 'Tampoco en USDA ni OFF.'
                : 'Nada en tu base.'
              : tab === 'favoritos'
                ? 'Aún no hay favoritos. Marca ☆ en cualquier producto.'
                : 'Aún no hay recientes.'}
          </p>
          {searching && !ext.results && (
            <Button variant="ghost" disabled={ext.busy} onClick={() => void searchExternal()}>
              {ext.busy ? 'Buscando fuera…' : 'Buscar en USDA / OFF'}
            </Button>
          )}
          {ext.error && <p className="text-sm text-alert">{ext.error}</p>}
          {searching && (
            <Link
              to={`/productos/nuevo?nombre=${encodeURIComponent(q)}`}
              className="text-action underline"
            >
              Crear producto «{q}»
            </Link>
          )}
        </div>
      )}
      {searching && ext.results && ext.results.length > 0 && (
        <section aria-label="Resultados externos" className="mt-2 grid gap-1">
          <p className="num text-xs tracking-[0.12em] text-ink-2">
            USDA · se guarda solo el que elijas
          </p>
          <ul className="divide-y divide-dashed divide-rule">
            {ext.results.map((r) => (
              <li key={r.source_id}>
                <button
                  type="button"
                  disabled={ext.busy}
                  onClick={() => void pickExternal(r)}
                  className="flex min-h-12 w-full items-baseline gap-1 py-2 text-left"
                >
                  <span className="min-w-0 truncate">
                    {r.needs_review && <span className="mr-1 text-alert">⚠</span>}
                    {r.name}
                  </span>
                  <span aria-hidden className="leader min-w-4 flex-1" />
                  <span className="num shrink-0">
                    {r.energy_kcal == null ? '—' : fmtKcal(r.energy_kcal)}
                    <span className="text-xs text-ink-2">/100g</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Sheet>
  );
}

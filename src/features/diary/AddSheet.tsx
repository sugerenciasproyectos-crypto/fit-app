import { ScanBarcode, Search } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';
import { fmtKcal } from '../../lib/format';
import { Sheet } from '../../ui/Sheet';
import { useProductSearch, type Product } from '../products/api';
import type { MealSlot } from './api';

type Tab = 'recientes' | 'favoritos';

/** H1 Añadir: búsqueda local, selector de comida y pestañas Recientes · Favoritos. */
export function AddSheet({
  slots,
  slotId,
  onSlot,
  onPick,
  onClose,
}: {
  slots: MealSlot[];
  slotId: string;
  onSlot: (id: string) => void;
  onPick: (p: Product) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('recientes');
  const deferred = useDeferredValue(q.trim());
  const searching = deferred.length > 0;
  const { data, isLoading, error } = useProductSearch({
    q: deferred,
    onlyFav: !searching && tab === 'favoritos',
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
        {!searching && (
          <div role="tablist" className="flex gap-4 text-sm">
            {(['recientes', 'favoritos'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`min-h-11 capitalize ${tab === t ? 'text-ink underline underline-offset-4' : 'text-ink-2'}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-alert">No se pudo buscar: {error.message}</p>}
      {isLoading ? (
        <p className="py-4 text-ink-2">Buscando…</p>
      ) : list && list.length > 0 ? (
        <ul className="divide-y divide-dashed divide-rule">
          {list.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p)}
                className="flex min-h-12 w-full items-baseline gap-1 py-2 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate">{p.name}</span>
                  {p.brand && <span className="block truncate text-xs text-ink-2">{p.brand}</span>}
                </span>
                <span aria-hidden className="leader min-w-4 flex-1" />
                <span className="num shrink-0">
                  {p.energy_kcal == null ? '—' : fmtKcal(p.energy_kcal)}
                  <span className="text-xs text-ink-2">/100{p.base_unit}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-3 py-6 text-center">
          <p className="text-ink-2">
            {searching
              ? 'Nada en tu base.'
              : tab === 'favoritos'
                ? 'Aún no hay favoritos. Marca ☆ en cualquier producto.'
                : 'Aún no hay recientes.'}
          </p>
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
    </Sheet>
  );
}

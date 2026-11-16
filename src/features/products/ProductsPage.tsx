import { Plus, Search, Star } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';
import { fmtKcal } from '../../lib/format';
import { SOURCE_LABEL, useProductSearch, type Product, type ProductSource } from './api';

function Row({ p }: { p: Product }) {
  const flag = p.needs_review || p.confidence === 'baja' || p.source === 'estimado';
  return (
    <li>
      <Link
        to={`/productos/${p.id}`}
        className="flex min-h-12 items-baseline gap-1 py-2"
        aria-label={`${p.name}${p.brand ? `, ${p.brand}` : ''}, ${p.energy_kcal == null ? 'kilocalorías desconocidas' : `${fmtKcal(p.energy_kcal)} kilocalorías por 100 ${p.base_unit}`}`}
      >
        <span className="min-w-0">
          <span className="block truncate">
            {p.favorite && <Star size={12} className="mr-1 inline fill-current" aria-hidden />}
            {flag && (
              <span className="mr-1 text-alert" aria-hidden>
                ⚠
              </span>
            )}
            {p.name}
          </span>
          <span className="block truncate text-xs text-ink-2">
            {p.brand ?? SOURCE_LABEL[p.source]}
          </span>
        </span>
        <span aria-hidden className="leader min-w-4 flex-1" />
        <span className="num shrink-0 text-right">
          {p.energy_kcal == null ? '—' : fmtKcal(p.energy_kcal)}
          <span className="text-xs text-ink-2"> /100{p.base_unit}</span>
        </span>
      </Link>
    </li>
  );
}

const SOURCES: ProductSource[] = [
  'manual',
  'etiqueta',
  'web',
  'estimado',
  'openfoodfacts',
  'usda',
  'seed',
  'receta',
];

/** T3 Productos. Recetas y comidas guardadas llegan en las fases 7 y 9. */
export default function ProductsPage() {
  const [q, setQ] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [review, setReview] = useState(false);
  const [source, setSource] = useState<ProductSource | ''>('');
  const deferred = useDeferredValue(q);
  const { data, isLoading, error, isFetching } = useProductSearch({
    q: deferred,
    onlyFav,
    review,
    source: source || null,
    limit: 200,
  });

  const chip = (on: boolean) =>
    `min-h-11 rounded-full border px-3 text-sm ${on ? 'border-ink font-semibold' : 'border-rule text-ink-2'}`;

  return (
    <div className="grid gap-4 py-4">
      <header className="flex items-center justify-between">
        <h1 className="num text-2xl">Productos</h1>
        <Link
          to="/productos/nuevo"
          className="flex min-h-11 items-center gap-1 rounded bg-action px-3 text-action-ink"
        >
          <Plus size={18} aria-hidden /> Nuevo
        </Link>
      </header>
      <label className="flex min-h-11 items-center gap-2 rounded border border-rule px-3">
        <Search size={18} strokeWidth={1.5} aria-hidden className="text-ink-2" />
        <span className="sr-only">Buscar productos</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre, marca o código"
          className="min-h-11 flex-1 bg-transparent outline-none"
        />
      </label>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
        <button
          type="button"
          aria-pressed={onlyFav}
          className={chip(onlyFav)}
          onClick={() => setOnlyFav(!onlyFav)}
        >
          ☆ Favoritos
        </button>
        <button
          type="button"
          aria-pressed={review}
          className={chip(review)}
          onClick={() => setReview(!review)}
        >
          ⚠ Revisar
        </button>
        <select
          aria-label="Origen"
          value={source}
          onChange={(e) => setSource(e.target.value as ProductSource | '')}
          className={chip(!!source)}
        >
          <option value="">Origen: todos</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="text-alert">
          No se pudo buscar: {error.message}
        </p>
      )}
      {isLoading ? (
        <div className="grid gap-3" role="status" aria-busy="true" aria-label="Cargando">
          {[70, 50, 80, 60].map((w) => (
            <div key={w} className="h-4 rounded bg-paper-2" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <ul
          className={`divide-y divide-dashed divide-rule ${isFetching ? 'opacity-70' : ''}`}
          aria-label="Resultados"
        >
          {data.map((p) => (
            <Row key={p.id} p={p} />
          ))}
        </ul>
      ) : (
        <div className="grid gap-3 py-6 text-center">
          <p className="text-ink-2">
            {onlyFav ? 'Aún no hay favoritos. Marca ☆ en cualquier producto.' : 'Nada en tu base.'}
          </p>
          {q && (
            <Link
              to={`/productos/nuevo?nombre=${encodeURIComponent(q)}`}
              className="text-action underline"
            >
              Crear producto «{q}»
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

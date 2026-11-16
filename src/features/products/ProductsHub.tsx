import { Link, useSearchParams } from 'react-router';
import { fmtKcal } from '../../lib/format';
import { savedMealKcal, useSavedMeals } from '../meals/api';
import ProductsPage from './ProductsPage';

const SEGMENTS = [
  { id: 'productos', label: 'Productos' },
  { id: 'recetas', label: 'Recetas' },
  { id: 'comidas', label: 'Comidas guardadas' },
] as const;
type Seg = (typeof SEGMENTS)[number]['id'];

function SavedMealsList() {
  const { data, isLoading } = useSavedMeals();
  return (
    <div className="grid gap-3">
      <Link
        to="/productos/comidas/nueva"
        className="flex min-h-11 items-center justify-center rounded bg-action text-action-ink"
      >
        + Nueva comida guardada
      </Link>
      {isLoading ? (
        <p className="text-ink-2">Cargando…</p>
      ) : data && data.length ? (
        <ul className="divide-y divide-dashed divide-rule">
          {data.map((m) => (
            <li key={m.id}>
              <Link
                to={`/productos/comidas/${m.id}`}
                className="flex min-h-12 items-baseline gap-1 py-2"
              >
                <span className="min-w-0 truncate">
                  {m.favorite && '☆ '}
                  {m.name}
                  <span className="block text-xs text-ink-2">{m.items.length} alimentos</span>
                </span>
                <span aria-hidden className="leader min-w-4 flex-1" />
                <span className="num">{fmtKcal(savedMealKcal(m))}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-ink-2">Aún no hay comidas guardadas.</p>
      )}
    </div>
  );
}

/** T3 con segmentos: Productos · Recetas · Comidas guardadas. */
export default function ProductsHub() {
  const [params, setParams] = useSearchParams();
  const seg = (params.get('seg') as Seg | null) ?? 'productos';
  return (
    <div>
      <div
        role="tablist"
        aria-label="Tipo"
        className="mt-3 flex gap-4 border-b border-dashed border-rule text-sm"
      >
        {SEGMENTS.map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={seg === s.id}
            onClick={() => setParams(s.id === 'productos' ? {} : { seg: s.id }, { replace: true })}
            className={`min-h-11 ${seg === s.id ? 'text-ink underline underline-offset-4' : 'text-ink-2'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {seg === 'productos' && <ProductsPage />}
      {seg === 'recetas' && <ProductsPage recipesOnly />}
      {seg === 'comidas' && (
        <div className="py-4">
          <SavedMealsList />
        </div>
      )}
    </div>
  );
}

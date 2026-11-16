import { useQueryClient } from '@tanstack/react-query';
import { Star, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { fmtKcal, fmtQty, parseDecimal } from '../../lib/format';
import { Button, Leader, TextField } from '../../ui/primitives';
import { useUserId } from '../auth/useAuth';
import { AddSheet } from '../diary/AddSheet';
import { useMealSlots } from '../diary/api';
import type { Product } from '../products/api';
import {
  deleteSavedMeal,
  saveSavedMeal,
  savedMealsKey,
  useSavedMeals,
  type SavedMealWithItems,
} from './api';

interface Row {
  product: Product;
  amount: string;
}

/** D3 Editor de comida guardada. */
export default function SavedMealPage() {
  const { id } = useParams();
  const meals = useSavedMeals();
  if (id !== 'nueva' && meals.isLoading) return <p className="py-6 text-ink-2">Cargando…</p>;
  const meal = id === 'nueva' ? null : (meals.data?.find((m) => m.id === id) ?? null);
  return <Editor key={id} meal={meal} />;
}

function Editor({ meal }: { meal: SavedMealWithItems | null }) {
  const userId = useUserId();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const slots = useMealSlots();
  const [name, setName] = useState(meal?.name ?? '');
  const [favorite, setFavorite] = useState(meal?.favorite ?? false);
  const [rows, setRows] = useState<Row[]>(
    () => meal?.items.map((i) => ({ product: i.product, amount: fmtQty(i.quantity) })) ?? [],
  );
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const total = rows.reduce(
    (s, r) => s + ((parseDecimal(r.amount) ?? 0) * (r.product.energy_kcal ?? 0)) / 100,
    0,
  );
  const valid =
    name.trim() && rows.length > 0 && rows.every((r) => (parseDecimal(r.amount) ?? 0) > 0);

  async function save() {
    if (!valid) return setError('Pon un nombre y al menos un alimento con cantidad.');
    setBusy(true);
    try {
      await saveSavedMeal(
        userId,
        meal?.id ?? null,
        name.trim(),
        favorite,
        rows.map((r) => ({
          product: r.product,
          quantity: parseDecimal(r.amount)!,
          portion_id: null,
          portion_count: null,
        })),
      );
      await qc.invalidateQueries({ queryKey: savedMealsKey });
      navigate('/productos?seg=comidas', { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 py-4">
      <header className="flex items-center justify-between">
        <Link to="/productos?seg=comidas" className="text-action underline">
          Comidas guardadas
        </Link>
        <button
          type="button"
          aria-pressed={favorite}
          aria-label={favorite ? 'Quitar de favoritos' : 'Marcar como favorita'}
          onClick={() => setFavorite(!favorite)}
          className="grid size-11 place-items-center"
        >
          <Star size={22} strokeWidth={1.5} className={favorite ? 'fill-current' : ''} />
        </button>
      </header>
      <h1 className="num text-2xl">{meal ? 'Comida guardada' : 'Nueva comida guardada'}</h1>
      <TextField
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Desayuno habitual"
      />

      <ul className="grid gap-2">
        {rows.map((r, i) => (
          <li
            key={`${r.product.id}-${i}`}
            className="grid grid-cols-[1fr_6.5rem_2.75rem] items-end gap-2"
          >
            <span className="min-w-0 pb-3">
              <span className="block truncate">{r.product.name}</span>
              <span className="num text-xs text-ink-2">
                {fmtKcal(((parseDecimal(r.amount) ?? 0) * (r.product.energy_kcal ?? 0)) / 100)} kcal
              </span>
            </span>
            <TextField
              label="Cantidad"
              inputMode="decimal"
              suffix={r.product.base_unit}
              value={r.amount}
              onChange={(e) =>
                setRows(rows.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))
              }
            />
            <button
              type="button"
              aria-label={`Quitar ${r.product.name}`}
              className="grid size-11 place-items-center text-ink-2"
              onClick={() => setRows(rows.filter((_, j) => j !== i))}
            >
              <X size={18} />
            </button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" onClick={() => setAdding(true)}>
        + Añadir alimento
      </Button>
      <Leader label="TOTAL" value={`${fmtKcal(total)} kcal`} strong />
      {error && (
        <p role="alert" className="text-sm text-alert">
          {error}
        </p>
      )}
      <Button onClick={save} disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar'}
      </Button>
      {meal && (
        <Button
          variant="danger"
          className="mt-10"
          onClick={async () => {
            await deleteSavedMeal(meal.id);
            await qc.invalidateQueries({ queryKey: savedMealsKey });
            navigate('/productos?seg=comidas', { replace: true });
          }}
        >
          Eliminar comida guardada
        </Button>
      )}
      {adding && slots.data && (
        <AddSheet
          slots={slots.data}
          slotId={slots.data[0]?.id ?? ''}
          onSlot={() => {}}
          onPick={(p) => {
            setRows([
              ...rows,
              {
                product: p,
                amount: fmtQty(p.last_quantity && !p.last_portion_id ? p.last_quantity : 100),
              },
            ]);
            setAdding(false);
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}

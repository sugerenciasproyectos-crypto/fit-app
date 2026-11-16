import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { recipeNutrients, type Nutrients } from '../../domain/nutrition';
import { fmtG, fmtKcal, fmtQty, parseDecimal } from '../../lib/format';
import { Button, Leader, SectionTitle, TextField } from '../../ui/primitives';
import { useToast } from '../../ui/useToast';
import { useUserId } from '../auth/useAuth';
import { AddSheet } from '../diary/AddSheet';
import { per100Of, useMealSlots } from '../diary/api';
import { correctionPreview, productsKey, type Product } from '../products/api';
import { CorrectionSheet } from '../products/CorrectionSheet';
import { saveRecipe, useRecipeByProduct, type RecipeFull } from './api';

/** D2 Editor de receta (id = producto derivado o "nueva"). */
export default function RecipePage() {
  const { id } = useParams();
  const isNew = id === 'nueva';
  const recipe = useRecipeByProduct(isNew ? undefined : id);
  if (!isNew && recipe.isLoading) return <p className="py-6 text-ink-2">Cargando…</p>;
  if (recipe.error)
    return (
      <p role="alert" className="py-6 text-alert">
        {recipe.error.message}
      </p>
    );
  return <Editor key={id} recipe={isNew ? null : recipe.data!} />;
}

interface Row {
  product: Product;
  amount: string;
}

function Editor({ recipe }: { recipe: RecipeFull | null }) {
  const userId = useUserId();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const slots = useMealSlots();
  const [name, setName] = useState(recipe?.product.name ?? '');
  const [servings, setServings] = useState(recipe?.servings == null ? '' : fmtQty(recipe.servings));
  const [cooked, setCooked] = useState(
    recipe?.cooked_weight_g == null ? '' : fmtQty(recipe.cooked_weight_g),
  );
  const [notes, setNotes] = useState(recipe?.notes ?? '');
  const [rows, setRows] = useState<Row[]>(
    () =>
      recipe?.ingredients.map((i) => ({ product: i.product, amount: fmtQty(i.quantity) })) ?? [],
  );
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [correctFor, setCorrectFor] = useState<string | null>(null);

  const valid = rows.filter((r) => (parseDecimal(r.amount) ?? 0) > 0);
  const result = useMemo(() => {
    if (!valid.length) return null;
    return recipeNutrients(
      valid.map((r) => ({
        quantity: parseDecimal(r.amount)!,
        unit: r.product.base_unit,
        per100: per100Of(r.product) as Nutrients,
      })),
      parseDecimal(cooked),
      parseDecimal(servings),
    );
  }, [valid, cooked, servings]);

  async function save() {
    if (!name.trim() || !result || valid.length !== rows.length) {
      return toast({
        message: 'Pon un nombre y cantidades en todos los ingredientes',
        error: true,
      });
    }
    setBusy(true);
    try {
      const pid = await saveRecipe(
        userId,
        recipe,
        {
          name,
          servings: parseDecimal(servings),
          cookedWeight: parseDecimal(cooked),
          notes,
          ingredients: rows.map((r) => ({ product: r.product, quantity: parseDecimal(r.amount)! })),
        },
        result,
      );
      await qc.invalidateQueries({ queryKey: productsKey });
      await qc.invalidateQueries({ queryKey: ['recipe'] });
      toast({ message: 'Receta guardada' });
      if (!recipe) return navigate(`/productos/recetas/${pid}`, { replace: true });
      const pre = await correctionPreview(pid).catch(() => null);
      if (pre?.rows) setCorrectFor(pid);
    } catch (e) {
      toast({ message: `No se guardó: ${(e as Error).message}`, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 py-4">
      <Link to="/productos?seg=recetas" className="text-action underline">
        Recetas
      </Link>
      <h1 className="num text-2xl">{recipe ? 'Receta' : 'Nueva receta'}</h1>
      <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />

      <section className="grid gap-2" aria-labelledby="ing">
        <SectionTitle id="ing">Ingredientes</SectionTitle>
        <ul className="grid gap-2">
          {rows.map((r, i) => (
            <li
              key={`${r.product.id}-${i}`}
              className="grid grid-cols-[1fr_6.5rem_2.75rem] items-end gap-2"
            >
              <span className="min-w-0 pb-3">
                <span className="block truncate">{r.product.name}</span>
                <span className="num text-xs text-ink-2">
                  {fmtKcal(((parseDecimal(r.amount) ?? 0) * (r.product.energy_kcal ?? 0)) / 100)}{' '}
                  kcal
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
          + Añadir ingrediente
        </Button>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Peso cocinado (opcional)"
          inputMode="decimal"
          suffix="g"
          value={cooked}
          onChange={(e) => setCooked(e.target.value)}
        />
        <TextField
          label="Raciones (opcional)"
          inputMode="decimal"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
        />
      </div>
      <TextField label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <section
        aria-label="Valores de la receta"
        aria-live="polite"
        className="num grid gap-1 border-y border-dashed border-rule py-3 text-sm"
      >
        {result ? (
          <>
            {result.needsReview && (
              <p className="text-alert">⚠ Mezcla g y ml: se trata 1 ml como 1 g.</p>
            )}
            <Leader label="Peso total" value={`${fmtQty(Math.round(result.totalWeight))} g`} />
            <Leader
              label="kcal / 100 g"
              value={result.per100.energy_kcal == null ? '—' : fmtKcal(result.per100.energy_kcal)}
              strong
            />
            <Leader
              label="P / C / G por 100 g"
              value={[result.per100.protein_g, result.per100.carbs_g, result.per100.fat_g]
                .map((v) => (v == null ? '—' : fmtG(v)))
                .join(' / ')}
            />
            {result.servingAmount && (
              <Leader
                label={`Ración (${fmtQty(Math.round(result.servingAmount))} g)`}
                value={
                  result.per100.energy_kcal == null
                    ? '—'
                    : `${fmtKcal((result.servingAmount * result.per100.energy_kcal) / 100)} kcal`
                }
              />
            )}
          </>
        ) : (
          <p className="text-ink-2">Añade ingredientes para ver los valores.</p>
        )}
      </section>

      <Button onClick={save} disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar receta'}
      </Button>

      {adding && slots.data && (
        <AddSheet
          slots={slots.data}
          slotId={slots.data[0]?.id ?? ''}
          onSlot={() => {}}
          onPick={(p) => {
            setRows([...rows, { product: p, amount: '100' }]);
            setAdding(false);
          }}
          onClose={() => setAdding(false)}
        />
      )}
      {correctFor && <CorrectionSheet productId={correctFor} onClose={() => setCorrectFor(null)} />}
    </div>
  );
}

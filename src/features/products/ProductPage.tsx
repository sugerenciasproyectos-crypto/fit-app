import { useQueryClient } from '@tanstack/react-query';
import { Star, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { NUTRIENT_KEYS } from '../../domain/nutrition';
import { Button, SectionTitle, TextField } from '../../ui/primitives';
import { useUserId } from '../auth/useAuth';
import {
  productsKey,
  saveProduct,
  softDeleteProduct,
  SOURCE_LABEL,
  useProduct,
  type ProductWithPortions,
} from './api';
import {
  dbErrorToField,
  draftFromProduct,
  emptyProductDraft,
  NUTRIENT_LABEL,
  toPatch,
  validateProduct,
  type ProductDraft,
  type ProductErrors,
} from './form';

/** D1 Ficha y edición de producto (y alta, con id = "nuevo"). */
export default function ProductPage() {
  const { id } = useParams();
  const isNew = id === 'nuevo';
  const { data, isLoading, error } = useProduct(isNew ? undefined : id);
  if (!isNew && isLoading) return <p className="py-6 text-ink-2">Cargando…</p>;
  if (error)
    return (
      <p role="alert" className="py-6 text-alert">
        {error.message}
      </p>
    );
  return <Editor key={id} product={isNew ? null : data!} />;
}

function Editor({ product }: { product: ProductWithPortions | null }) {
  const userId = useUserId();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [draft, setDraft] = useState<ProductDraft>(() => {
    if (product) return draftFromProduct(product);
    const d = emptyProductDraft(params.get('codigo') ?? '');
    d.name = params.get('nombre') ?? '';
    return d;
  });
  const [errors, setErrors] = useState<ProductErrors>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (patch: Partial<ProductDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
  };
  const unit = draft.base_unit;

  async function save() {
    const v = validateProduct(draft);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const { patch, portions } = toPatch(draft, product !== null);
      const pid = await saveProduct(userId, product?.id ?? null, patch, portions);
      await qc.invalidateQueries({ queryKey: productsKey });
      setSaved(true);
      if (!product) navigate(`/productos/${pid}`, { replace: true });
    } catch (e) {
      setErrors(dbErrorToField((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!product) return;
    setBusy(true);
    try {
      await softDeleteProduct(product.id);
      await qc.invalidateQueries({ queryKey: productsKey });
      navigate('/productos', { replace: true });
    } catch (e) {
      setErrors({ form: (e as Error).message });
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 py-4">
      <header className="flex items-center justify-between gap-2">
        <Link to="/productos" className="text-action underline">
          Productos
        </Link>
        <button
          type="button"
          aria-pressed={draft.favorite}
          aria-label={draft.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
          className="grid size-11 place-items-center"
          onClick={() => set({ favorite: !draft.favorite })}
        >
          <Star size={22} strokeWidth={1.5} className={draft.favorite ? 'fill-current' : ''} />
        </button>
      </header>
      <h1 className="num text-2xl">{product ? 'Producto' : 'Nuevo producto'}</h1>

      <div className="grid gap-4">
        <TextField
          label="Nombre"
          value={draft.name}
          error={errors.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <TextField
          label="Marca"
          value={draft.brand}
          onChange={(e) => set({ brand: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Código de barras"
            inputMode="numeric"
            value={draft.barcode}
            error={errors.barcode}
            onChange={(e) => set({ barcode: e.target.value })}
          />
          <TextField
            label="Categoría"
            value={draft.category}
            onChange={(e) => set({ category: e.target.value })}
          />
        </div>
        <fieldset>
          <legend className="mb-1 text-sm text-ink-2">Unidad base</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['g', 'ml'] as const).map((u) => (
              <label
                key={u}
                className={`flex min-h-11 items-center justify-center rounded border ${unit === u ? 'border-ink font-semibold' : 'border-rule'}`}
              >
                <input
                  type="radio"
                  name="unit"
                  className="sr-only"
                  checked={unit === u}
                  onChange={() => set({ base_unit: u })}
                />
                {u === 'g' ? 'Gramos (g)' : 'Mililitros (ml)'}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField
          label="Tamaño del envase"
          inputMode="decimal"
          suffix={unit}
          value={draft.package_size}
          error={errors.package_size}
          onChange={(e) => set({ package_size: e.target.value })}
        />
      </div>

      <section className="grid gap-1 border-y-2 border-ink py-2" aria-labelledby="nutri">
        <h2 id="nutri" className="num flex justify-between border-b border-ink pb-1 font-semibold">
          <span>Información nutricional</span>
          <span>por 100 {unit}</span>
        </h2>
        {NUTRIENT_KEYS.map((k) => {
          const err = errors[`nutrients.${k}`];
          return (
            <div
              key={k}
              className="grid grid-cols-[1fr_7rem_2.5rem] items-center gap-2 border-b border-dotted border-rule py-1"
            >
              <label
                htmlFor={`n-${k}`}
                className={`whitespace-pre ${k === 'energy_kcal' ? 'font-semibold' : ''}`}
              >
                {NUTRIENT_LABEL[k]}
              </label>
              <input
                id={`n-${k}`}
                inputMode="decimal"
                placeholder="—"
                aria-invalid={err ? true : undefined}
                value={draft.nutrients[k]}
                onChange={(e) => set({ nutrients: { ...draft.nutrients, [k]: e.target.value } })}
                className="num min-h-11 rounded border border-rule bg-paper px-2 text-right aria-invalid:border-alert"
              />
              <span className="num text-sm text-ink-2">{k === 'energy_kcal' ? 'kcal' : 'g'}</span>
              {err && <p className="col-span-3 text-sm text-alert">{err}</p>}
            </div>
          );
        })}
        <p className="pt-1 text-xs text-ink-2">Vacío = desconocido (no cuenta como 0).</p>
      </section>

      <section className="grid gap-2" aria-labelledby="porc">
        <div id="porc">
          <SectionTitle>Porciones</SectionTitle>
        </div>
        {draft.portions.map((p, i) => (
          <div
            key={p.id ?? `new-${i}`}
            className="grid grid-cols-[1fr_6rem_2.75rem] items-start gap-2"
          >
            <TextField
              label="Nombre"
              value={p.name}
              error={errors[`portions.${i}.name`]}
              onChange={(e) => {
                const portions = [...draft.portions];
                portions[i] = { ...p, name: e.target.value };
                set({ portions });
              }}
            />
            <TextField
              label="Cantidad"
              inputMode="decimal"
              suffix={unit}
              value={p.amount}
              error={errors[`portions.${i}.amount`]}
              onChange={(e) => {
                const portions = [...draft.portions];
                portions[i] = { ...p, amount: e.target.value };
                set({ portions });
              }}
            />
            <button
              type="button"
              aria-label={`Quitar porción ${p.name}`}
              className="mt-6 grid size-11 place-items-center text-ink-2"
              onClick={() => set({ portions: draft.portions.filter((_, j) => j !== i) })}
            >
              <X size={18} />
            </button>
          </div>
        ))}
        {errors.portions && <p className="text-sm text-alert">{errors.portions}</p>}
        <Button
          variant="ghost"
          onClick={() => set({ portions: [...draft.portions, { name: '', amount: '' }] })}
        >
          + Añadir porción
        </Button>
      </section>

      {product && (
        <footer className="grid gap-0.5 text-xs text-ink-2">
          <span>
            Origen: {SOURCE_LABEL[product.source]}
            {product.manually_edited && ' · editado a mano'}
            {product.confidence && ` · confianza ${product.confidence}`}
          </span>
          <span className="num">
            Creado {product.created_at.slice(0, 10)} · actualizado {product.updated_at.slice(0, 10)}
          </span>
          {product.warnings.map((w) => (
            <span key={w}>⚠ {w}</span>
          ))}
        </footer>
      )}

      <div aria-live="polite" className="text-sm">
        {saved && <span className="text-ink-2">Guardado.</span>}
        {errors.form && <span className="text-alert">No se guardó: {errors.form}</span>}
      </div>
      <Button onClick={save} disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar'}
      </Button>

      {product && (
        <div className="mt-10 grid gap-2">
          {confirmDelete ? (
            <>
              <p className="text-sm">
                Desaparecerá de las búsquedas. Los registros del diario que lo usan se conservan.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={remove} disabled={busy}>
                  Eliminar
                </Button>
              </div>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={16} className="mr-1 inline" aria-hidden /> Eliminar producto
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

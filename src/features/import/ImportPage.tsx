import { useQueryClient } from '@tanstack/react-query';
import { useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  MAX_BYTES,
  parseInterchangeText,
  type FieldError,
  type Product as ImportProduct,
} from '../../../packages/schemas/src';
import { NUTRIENT_KEYS } from '../../domain/nutrition';
import { fmtKcal, parseDecimal } from '../../lib/format';
import type { Json } from '../../lib/db.types';
import { supabase } from '../../lib/supabase';
import { Button, SectionTitle } from '../../ui/primitives';
import { useToast } from '../../ui/useToast';
import { productsKey } from '../products/api';
import { NUTRIENT_LABEL } from '../products/form';
import { supermarketsKey } from '../supermarkets/api';
import {
  buildPayload,
  initialRows,
  isEstimated,
  needsReview,
  summary,
  unknownSupermarkets,
  type Action,
  type Row,
} from './plan';

const ACTION_LABEL: Record<Action, string> = {
  update: 'Actualizar',
  merge: 'Fusionar',
  new: 'Nuevo',
  skip: 'Omitir',
};

type Step =
  | { kind: 'input' }
  | {
      kind: 'preview';
      rows: Row[];
      newMarkets: string[];
      confirmed: Set<string>;
      warnings: string[];
    };

/** D4 Entrada + D5 Vista previa de la importación desde IA (M15). */
export default function ImportPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [step, setStep] = useState<Step>({ kind: 'input' });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  async function validate(raw = text) {
    setErrors([]);
    const r = parseInterchangeText(raw);
    if (!r.ok) return setErrors(r.errors);
    if (r.kind === 'backup') {
      return setErrors([
        {
          path: '',
          message: 'Es una copia de seguridad: restáurala desde Ajustes → Copia de seguridad.',
        },
      ]);
    }
    setBusy(true);
    const [prods, markets] = await Promise.all([
      supabase.from('products').select('id, name, brand, barcode').is('deleted_at', null),
      supabase.from('supermarkets').select('name'),
    ]);
    setBusy(false);
    if (prods.error || markets.error)
      return setErrors([{ path: '', message: 'No se pudieron leer tus productos' }]);
    const products = r.data.products ?? [];
    const newMarkets = unknownSupermarkets(
      products,
      markets.data.map((m) => m.name),
    );
    setStep({
      kind: 'preview',
      rows: initialRows(products, prods.data),
      newMarkets,
      confirmed: new Set(newMarkets),
      warnings: r.warnings,
    });
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) return setErrors([{ path: '', message: 'El archivo supera 5 MB' }]);
    const t = await f.text();
    setText(t);
    await validate(t);
  }

  if (step.kind === 'input') {
    return (
      <div className="grid gap-4 py-4">
        <header className="flex items-baseline justify-between">
          <h1 className="num text-2xl">Importar JSON</h1>
          <Link to="/productos" className="text-action underline">
            Productos
          </Link>
        </header>
        <p className="text-sm text-ink-2">
          Pega el JSON (<span className="num">schema_version: 1</span>) o abre un archivo. Máximo 5
          MB y 2.000 productos.
        </p>
        <label className="grid gap-1">
          <span className="text-sm text-ink-2">JSON</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            spellCheck={false}
            className="num rounded border border-rule bg-paper p-2 text-xs"
          />
        </label>
        <label className="flex min-h-11 items-center justify-center rounded border border-rule">
          Abrir archivo .json
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={onFile}
          />
        </label>
        {errors.length > 0 && (
          <ul role="alert" className="num grid gap-1 text-xs text-alert">
            {errors.slice(0, 50).map((e, i) => (
              <li key={i}>
                {e.path ? `${e.path}: ` : ''}
                {e.message}
              </li>
            ))}
            {errors.length > 50 && <li>… y {errors.length - 50} errores más</li>}
          </ul>
        )}
        <Button onClick={() => void validate()} disabled={!text.trim() || busy}>
          {busy ? 'Validando…' : 'Validar y revisar'}
        </Button>
      </div>
    );
  }

  const { rows, newMarkets, confirmed } = step;
  const setRows = (next: Row[]) => setStep({ ...step, rows: next });
  const setRow = (i: number, patch: Partial<Row>) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setProduct = (i: number, patch: Partial<ImportProduct>) =>
    setRow(i, { product: { ...rows[i]!.product, ...patch } });
  const dups = rows.filter((r) => r.duplicate).length;
  const { imported, skipped } = summary(rows);

  async function doImport() {
    // Los supermercados no confirmados se quitan de los productos (nunca se crean en silencio).
    const rejected = new Set(
      newMarkets.filter((m) => !confirmed.has(m)).map((m) => m.toLowerCase()),
    );
    const clean = rows.map((r) => ({
      ...r,
      product: {
        ...r.product,
        supermarkets: r.product.supermarkets.filter((s) => !rejected.has(s.trim().toLowerCase())),
      },
    }));
    const { payload, decisions } = buildPayload(clean, [...confirmed]);
    setBusy(true);
    const { data, error } = await supabase.rpc('import_products', {
      payload: payload as unknown as Json,
      decisions: decisions as unknown as Json,
    });
    setBusy(false);
    if (error) return toast({ message: `No se importó nada: ${error.message}`, error: true });
    await qc.invalidateQueries({ queryKey: productsKey });
    await qc.invalidateQueries({ queryKey: supermarketsKey });
    const d = data as { new: number; updated: number; merged: number; skipped: number };
    toast({
      message: `Importados: ${d.new} nuevos · ${d.updated} actualizados · ${d.merged} fusionados`,
    });
    navigate('/productos', { replace: true });
  }

  return (
    <div className="grid gap-4 py-4 pb-28">
      <header className="flex items-baseline justify-between">
        <h1 className="num text-2xl">Vista previa</h1>
        <button
          type="button"
          className="text-action underline"
          onClick={() => setStep({ kind: 'input' })}
        >
          Volver al JSON
        </button>
      </header>
      {step.warnings.length > 0 && (
        <details className="text-xs text-ink-2">
          <summary className="min-h-11">{step.warnings.length} avisos del archivo</summary>
          <ul className="num">
            {step.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </details>
      )}
      {newMarkets.length > 0 && (
        <section className="grid gap-1" aria-labelledby="nm">
          <SectionTitle id="nm">Supermercados nuevos</SectionTitle>
          {newMarkets.map((m) => (
            <label key={m} className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                className="size-5 accent-[var(--action)]"
                checked={confirmed.has(m)}
                onChange={(e) => {
                  const next = new Set(confirmed);
                  if (e.target.checked) next.add(m);
                  else next.delete(m);
                  setStep({ ...step, confirmed: next });
                }}
              />
              Crear «{m}»
            </label>
          ))}
        </section>
      )}
      {dups > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>{dups} duplicados · aplicar a todos:</span>
          {(['update', 'merge', 'new', 'skip'] as const).map((a) => (
            <button
              key={a}
              type="button"
              className="min-h-11 rounded border border-rule px-2"
              onClick={() => setRows(rows.map((r) => (r.duplicate ? { ...r, action: a } : r)))}
            >
              {ACTION_LABEL[a]}
            </button>
          ))}
        </div>
      )}

      <ol className="grid gap-3">
        {rows.map((r, i) => {
          const p = r.product;
          const review = needsReview(p);
          const actions: Action[] = r.duplicate
            ? ['update', 'merge', 'new', 'skip']
            : ['new', 'skip'];
          return (
            <li
              key={i}
              className={`grid gap-2 border-y border-dashed border-rule py-2 ${r.action === 'skip' ? 'opacity-50' : ''}`}
            >
              <div className="flex items-baseline gap-1">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {review && <span className="text-alert">⚠ </span>}
                    {isEstimated(p) && <span title="estimado">≈ </span>}
                    {p.name}
                  </span>
                  <span className="block text-xs text-ink-2">
                    {p.brand ?? '—'} · {p.source}
                    {p.confidence ? ` · confianza ${p.confidence}` : ''}
                  </span>
                </span>
                <span aria-hidden className="leader min-w-4 flex-1" />
                <span className="num">
                  {p.nutrients_per_100.energy_kcal == null
                    ? '—'
                    : fmtKcal(p.nutrients_per_100.energy_kcal)}
                  <span className="text-xs text-ink-2">/100{p.base_unit}</span>
                </span>
              </div>
              {r.duplicate && (
                <p className="num text-xs">
                  DUPLICADO ({r.duplicate.by}) de «{r.duplicate.name}»
                </p>
              )}
              {p.warnings.length > 0 && (
                <details className="text-xs text-ink-2">
                  <summary className="min-h-11">{p.warnings.length} avisos</summary>
                  <ul>
                    {p.warnings.map((w) => (
                      <li key={w}>· {w}</li>
                    ))}
                  </ul>
                </details>
              )}
              <div
                role="radiogroup"
                aria-label={`Acción para ${p.name}`}
                className="flex flex-wrap gap-1"
              >
                {actions.map((a) => (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={r.action === a}
                    onClick={() => setRow(i, { action: a })}
                    className={`min-h-11 rounded border px-2 text-sm ${r.action === a ? 'border-ink font-semibold' : 'border-rule text-ink-2'}`}
                  >
                    {ACTION_LABEL[a]}
                  </button>
                ))}
                <button
                  type="button"
                  className="ml-auto min-h-11 text-sm text-action underline"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  {open === i ? 'Cerrar' : 'Editar'}
                </button>
              </div>
              {open === i && (
                <div className="grid gap-2 text-sm">
                  {(['name', 'brand', 'barcode'] as const).map((k) => (
                    <label key={k} className="grid gap-1">
                      <span className="text-ink-2">
                        {k === 'name' ? 'Nombre' : k === 'brand' ? 'Marca' : 'Código'}
                      </span>
                      <input
                        value={p[k] ?? ''}
                        onChange={(e) =>
                          setProduct(i, { [k]: e.target.value || (k === 'name' ? '' : null) })
                        }
                        className="min-h-11 rounded border border-rule bg-paper px-2"
                      />
                    </label>
                  ))}
                  {NUTRIENT_KEYS.map((k) => (
                    <label key={k} className="grid grid-cols-[1fr_6rem] items-center gap-2">
                      <span className="whitespace-pre">{NUTRIENT_LABEL[k]}</span>
                      <input
                        inputMode="decimal"
                        defaultValue={
                          p.nutrients_per_100[k] == null
                            ? ''
                            : String(p.nutrients_per_100[k]).replace('.', ',')
                        }
                        onBlur={(e) =>
                          setProduct(i, {
                            nutrients_per_100: {
                              ...p.nutrients_per_100,
                              [k]: e.target.value.trim() ? parseDecimal(e.target.value) : null,
                            },
                          })
                        }
                        className="num min-h-11 rounded border border-rule bg-paper px-2 text-right"
                      />
                    </label>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-dashed border-ink bg-paper px-4 py-3">
        <div className="mx-auto max-w-[448px]">
          <Button
            className="w-full"
            onClick={() => void doImport()}
            disabled={busy || imported === 0}
          >
            {busy ? 'Importando…' : `Importar ${imported} · Omitir ${skipped}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

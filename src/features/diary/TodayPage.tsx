import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { useSearchParams } from 'react-router';
import { addDays } from '../../domain/dates';
import { sumNutrients, type Nutrients } from '../../domain/nutrition';
import { fmtKcal, fmtQty, fmtTicketDay } from '../../lib/format';
import { useOnline } from '../../lib/useOnline';
import { useToday } from '../../lib/useToday';
import { useToast } from '../../ui/useToast';
import { useUserId } from '../auth/useAuth';
import { useProduct, type Product } from '../products/api';
import { useLastWeight, useProfile } from '../profile/api';
import { computeTargets } from '../profile/targets';
import {
  dayFlagKey,
  diaryKey,
  entryNutrientsOf,
  per100Of,
  restoreEntry,
  setDayIncomplete,
  useAddEntry,
  useDayFlag,
  useDeleteEntry,
  useDiary,
  useMealSlots,
  useUpdateEntry,
  type Entry,
} from './api';
import { AddSheet } from './AddSheet';
import { madridTime, slotForTime } from './meals';
import { QuantitySheet } from './QuantitySheet';
import { RemainingBlock } from './RemainingBlock';
import { useProposals } from '../tdee/api';
import { ProposalCard } from '../tdee/ProposalCard';
import { useWeights } from '../weight/api';
import { WeightCard } from '../weight/WeightCard';
import { trendAt } from '../../domain/trend';

type Sheet =
  | { kind: 'add'; slotId: string }
  | { kind: 'qty'; product: Product; slotId: string }
  | { kind: 'edit'; entry: Entry }
  | null;

function vibrate() {
  try {
    navigator.vibrate?.(10);
  } catch {
    /* no disponible en iOS web */
  }
}

function EntryRow({
  e,
  fresh,
  onOpen,
  onDelete,
}: {
  e: Entry;
  fresh: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const qty = e.portion_name
    ? `${fmtQty(e.portion_count ?? 1)} × ${e.portion_name}`
    : `${fmtQty(e.quantity)} ${e.unit}`;
  const partial = [e.protein_g, e.carbs_g, e.fat_g, e.fiber_g].some((v) => v == null);
  return (
    <li className={`relative overflow-hidden ${fresh ? 'print-row' : ''}`}>
      <button
        type="button"
        onClick={onDelete}
        className="absolute inset-y-0 right-0 w-24 bg-alert text-paper"
        tabIndex={-1}
        aria-hidden
      >
        Eliminar
      </button>
      <button
        type="button"
        onClick={() => (dx < -40 ? setDx(0) : onOpen())}
        onTouchStart={(t: TouchEvent) => (start.current = t.touches[0]!.clientX)}
        onTouchMove={(t: TouchEvent) => {
          if (start.current === null) return;
          setDx(Math.max(-96, Math.min(0, t.touches[0]!.clientX - start.current)));
        }}
        onTouchEnd={() => {
          start.current = null;
          setDx((d) => (d < -48 ? -96 : 0));
        }}
        style={{ transform: `translateX(${dx}px)` }}
        className={`relative flex min-h-12 w-full items-baseline gap-1 bg-paper py-1.5 pl-2 text-left ${e.id.startsWith('tmp-') ? 'opacity-60' : ''}`}
      >
        <span className="min-w-0">
          <span className="block truncate">
            {e.product_name}
            {partial && (
              <span className="ml-1 text-ink-2" aria-hidden>
                ½
              </span>
            )}
          </span>
          <span className="sr-only">, </span>
          <span className="num block text-xs text-ink-2">{qty}</span>
        </span>
        <span aria-hidden className="leader min-w-4 flex-1" />
        <span className="sr-only">, </span>
        <span className="num shrink-0">
          {e.energy_kcal == null ? '—' : fmtKcal(e.energy_kcal)}
          <span className="sr-only"> kcal</span>
        </span>
      </button>
    </li>
  );
}

/** T1 Hoy: el ticket del día. */
export default function TodayPage() {
  const today = useToday();
  const userId = useUserId();
  const qc = useQueryClient();
  const toast = useToast();
  const online = useOnline();
  const [params, setParams] = useSearchParams();
  const day = params.get('dia') ?? today;
  const setDay = (d: string) => setParams(d === today ? {} : { dia: d }, { replace: true });

  const profile = useProfile();
  const weight = useLastWeight();
  const weights = useWeights();
  const proposals = useProposals();
  const pendingProposal = proposals.data?.find((p) => p.status === 'pending');
  const slots = useMealSlots();
  const diary = useDiary(day);
  const flag = useDayFlag(day);
  const add = useAddEntry(userId);
  const update = useUpdateEntry();
  const del = useDeleteEntry();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [menu, setMenu] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const swipe = useRef<number | null>(null);

  const entries = useMemo(() => diary.data ?? [], [diary.data]);
  const totals = useMemo(() => sumNutrients(entries.map(entryNutrientsOf)), [entries]);
  const targets = useMemo(() => {
    if (!profile.data) return null;
    const ref =
      (weights.data && trendAt(weights.data.trend, today)) ?? weight.data?.weight_kg ?? 70;
    return computeTargets(profile.data, ref, today, profile.data.tdee_current);
  }, [profile.data, weight.data, weights.data, today]);

  useEffect(() => {
    if (!fresh) return;
    const t = window.setTimeout(() => setFresh(null), 400);
    return () => window.clearTimeout(t);
  }, [fresh]);

  const defaultSlot = () => slotForTime(slots.data ?? [], madridTime(new Date()))?.id ?? '';

  function remove(e: Entry) {
    setSheet(null);
    del.mutate(e, {
      onSuccess: () =>
        toast({
          message: `Eliminado · ${e.product_name}`,
          action: {
            label: 'Deshacer',
            run: () =>
              restoreEntry(e).then(() => qc.invalidateQueries({ queryKey: diaryKey(e.day) })),
          },
        }),
      onError: () => toast({ message: 'No se eliminó', error: true }),
    });
  }

  const pending =
    sheet?.kind === 'qty'
      ? sheet.product.id
      : sheet?.kind === 'edit'
        ? (sheet.entry.product_id ?? undefined)
        : undefined;
  const productDetail = useProduct(pending);

  return (
    <div
      className="grid gap-4 py-3"
      onTouchStart={(t) => (swipe.current = t.touches[0]!.clientX)}
      onTouchEnd={(t) => {
        if (swipe.current === null || sheet) return;
        const dx = t.changedTouches[0]!.clientX - swipe.current;
        swipe.current = null;
        if (Math.abs(dx) > 90 && !(t.target as HTMLElement).closest('li'))
          setDay(addDays(day, dx > 0 ? -1 : 1));
      }}
    >
      {!online && (
        <p
          role="status"
          className="num sticky top-0 z-20 border-y border-dashed border-alert bg-paper py-1 text-center text-xs text-alert"
        >
          SIN CONEXIÓN — no se guardan cambios
        </p>
      )}
      <header className="relative flex items-center justify-between">
        <button
          type="button"
          aria-label="Día anterior"
          className="grid size-11 place-items-center"
          onClick={() => setDay(addDays(day, -1))}
        >
          <ChevronLeft size={22} strokeWidth={1.5} />
        </button>
        <h1 className="num text-center text-sm tracking-[0.12em]">
          {fmtTicketDay(day)}
          {day === today && <span className="sr-only"> (hoy)</span>}
          {flag.data && <span className="block text-xs text-ink-2">INCOMPLETO</span>}
        </h1>
        <div className="flex">
          <button
            type="button"
            aria-label="Día siguiente"
            disabled={day >= today}
            className="grid size-11 place-items-center disabled:opacity-30"
            onClick={() => setDay(addDays(day, 1))}
          >
            <ChevronRight size={22} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Más opciones"
            aria-expanded={menu}
            className="grid size-11 place-items-center"
            onClick={() => setMenu(!menu)}
          >
            <MoreHorizontal size={22} strokeWidth={1.5} />
          </button>
        </div>
        {menu && (
          <div className="absolute top-12 right-0 z-30 grid min-w-56 border border-ink bg-paper">
            <button
              type="button"
              className="min-h-11 px-3 text-left"
              onClick={async () => {
                setMenu(false);
                try {
                  await setDayIncomplete(userId, day, !flag.data);
                  qc.invalidateQueries({ queryKey: dayFlagKey(day) });
                } catch {
                  toast({ message: 'No se guardó', error: true });
                }
              }}
            >
              {flag.data ? 'Marcar día completo' : 'Marcar día incompleto'}
            </button>
            {day !== today && (
              <button
                type="button"
                className="min-h-11 px-3 text-left"
                onClick={() => {
                  setMenu(false);
                  setDay(today);
                }}
              >
                Volver a hoy
              </button>
            )}
          </div>
        )}
      </header>

      {targets && <RemainingBlock targets={targets} totals={totals} />}

      <hr className="border-0 border-t border-dashed border-rule" />
      {pendingProposal && <ProposalCard p={pendingProposal} />}
      <WeightCard day={day} />

      <hr className="border-0 border-t border-dashed border-rule" />

      {diary.isLoading || slots.isLoading ? (
        <div className="grid gap-3" role="status" aria-busy="true" aria-label="Cargando">
          {[50, 70, 40, 60].map((w) => (
            <div key={w} className="h-4 rounded bg-paper-2" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : diary.error ? (
        <p role="alert" className="text-alert">
          No se pudo cargar el día: {diary.error.message}
        </p>
      ) : (
        <div className="grid gap-4">
          {entries.length === 0 && day === today && (
            <p className="num py-2 text-center text-ink-2">
              — ticket vacío —
              <br />
              <span className="font-sans text-sm">Toca + para apuntar tu primera comida.</span>
            </p>
          )}
          {(slots.data ?? []).map((s) => {
            const items = entries.filter((e) => e.meal_slot_id === s.id);
            const sub = items.reduce((a, e) => a + (e.energy_kcal ?? 0), 0);
            return (
              <section key={s.id} aria-label={s.name}>
                <div className="flex items-center gap-1">
                  <h2 className="num text-sm tracking-[0.12em] uppercase">{s.name}</h2>
                  <span aria-hidden className="leader min-w-4 flex-1" />
                  <span className="num">{fmtKcal(sub)}</span>
                  <button
                    type="button"
                    aria-label={`Añadir a ${s.name}`}
                    className="grid size-11 place-items-center text-action"
                    onClick={() => setSheet({ kind: 'add', slotId: s.id })}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <ul>
                  {items.length === 0 ? (
                    <li className="pl-2 text-sm text-ink-2">— sin registros —</li>
                  ) : (
                    items.map((e) => (
                      <EntryRow
                        key={e.id}
                        e={e}
                        fresh={fresh === e.product_id}
                        onOpen={() => setSheet({ kind: 'edit', entry: e })}
                        onDelete={() => remove(e)}
                      />
                    ))
                  )}
                </ul>
                <hr className="mt-2 border-0 border-t border-dashed border-rule" />
              </section>
            );
          })}
        </div>
      )}

      <button
        type="button"
        aria-label="Añadir alimento"
        disabled={!online}
        onClick={() => setSheet({ kind: 'add', slotId: defaultSlot() })}
        className="fixed right-[max(1rem,calc(50vw-224px))] bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-full bg-action text-action-ink disabled:opacity-50"
      >
        <Plus size={28} />
      </button>

      {sheet?.kind === 'add' && slots.data && (
        <AddSheet
          slots={slots.data}
          slotId={sheet.slotId}
          onSlot={(id) => setSheet({ kind: 'add', slotId: id })}
          onPick={(product) => setSheet({ kind: 'qty', product, slotId: sheet.slotId })}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet?.kind === 'qty' && slots.data && (
        <QuantitySheet
          title="Cantidad"
          name={sheet.product.name}
          brand={sheet.product.brand}
          unit={sheet.product.base_unit}
          per100={per100Of(sheet.product)}
          portions={productDetail.data?.portions ?? []}
          slots={slots.data}
          initial={{
            quantity: sheet.product.last_portion_id ? 1 : (sheet.product.last_quantity ?? 100),
            mealSlotId: sheet.slotId,
            portionId: sheet.product.last_portion_id,
            portionCount: sheet.product.last_portion_id ? sheet.product.last_quantity : null,
          }}
          confirmLabel={(k) => `Añadir ${k} kcal`}
          busy={add.isPending}
          onClose={() => setSheet(null)}
          onConfirm={(r) => {
            const product = sheet.product;
            setSheet(null);
            setFresh(product.id);
            vibrate();
            add.mutate(
              { day, mealSlotId: r.mealSlotId, product, quantity: r.quantity, portion: r.portion },
              {
                onSuccess: (row) =>
                  toast({
                    message: `Añadido · ${product.name}`,
                    action: { label: 'Deshacer', run: () => del.mutate(row) },
                  }),
                onError: () =>
                  toast({
                    message: 'No se guardó',
                    error: true,
                    action: {
                      label: 'Reintentar',
                      run: () =>
                        add.mutate({
                          day,
                          mealSlotId: r.mealSlotId,
                          product,
                          quantity: r.quantity,
                          portion: r.portion,
                        }),
                    },
                  }),
              },
            );
          }}
        />
      )}

      {sheet?.kind === 'edit' && slots.data && (
        <QuantitySheet
          title="Editar registro"
          name={sheet.entry.product_name}
          brand={sheet.entry.product_brand}
          unit={sheet.entry.unit}
          per100={sheet.entry.per100 as unknown as Nutrients}
          portions={productDetail.data?.portions ?? []}
          slots={slots.data}
          initial={{
            quantity: sheet.entry.quantity,
            mealSlotId: sheet.entry.meal_slot_id,
            portionId: productDetail.data ? sheet.entry.portion_id : null,
            portionCount: sheet.entry.portion_count,
          }}
          confirmLabel={(k) => `Guardar ${k} kcal`}
          busy={update.isPending}
          onClose={() => setSheet(null)}
          onDelete={() => remove(sheet.entry)}
          onConfirm={(r) => {
            const entry = sheet.entry;
            setSheet(null);
            update.mutate(
              {
                entry,
                quantity: r.quantity,
                mealSlotId: r.mealSlotId,
                day: entry.day,
                portion: r.portion,
              },
              { onError: () => toast({ message: 'No se guardó', error: true }) },
            );
          }}
        />
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { entryNutrients, type Nutrients } from '../../domain/nutrition';
import { fmtG, fmtKcal, fmtQty, parseDecimal } from '../../lib/format';
import { Button } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import type { Portion } from '../products/api';
import type { MealSlot } from './api';

export interface QuantityResult {
  quantity: number;
  mealSlotId: string;
  portion: { id: string; name: string; count: number } | null;
}

interface Props {
  title: string;
  name: string;
  brand: string | null;
  unit: 'g' | 'ml';
  per100: Nutrients;
  portions: Portion[];
  slots: MealSlot[];
  initial: {
    quantity: number;
    mealSlotId: string;
    portionId: string | null;
    portionCount: number | null;
  };
  confirmLabel: (kcal: string) => string;
  onConfirm: (r: QuantityResult) => void;
  onDelete?: () => void;
  onClose: () => void;
  busy?: boolean;
}

/** H2 Cantidad: unidad o porción, 1× ½ 2×, totales en vivo. */
export function QuantitySheet(p: Props) {
  const [mode, setMode] = useState<string>(p.initial.portionId ?? 'base');
  const [amount, setAmount] = useState(() =>
    fmtQty(p.initial.portionId ? (p.initial.portionCount ?? 1) : p.initial.quantity),
  );
  const [slot, setSlot] = useState(p.initial.mealSlotId);
  const portion = p.portions.find((x) => x.id === mode) ?? null;
  const n = parseDecimal(amount);
  const quantity = n !== null && n > 0 ? (portion ? n * portion.amount : n) : null;
  const live = useMemo(
    () => (quantity ? entryNutrients(quantity, p.per100) : null),
    [quantity, p.per100],
  );
  const kcalText = live?.energy_kcal == null ? '—' : fmtKcal(live.energy_kcal);

  const scale = (f: number) => n !== null && setAmount(fmtQty(Math.round(n * f * 100) / 100));

  return (
    <Sheet title={p.title} onClose={p.onClose}>
      <div className="grid gap-4">
        <div>
          <p className="font-semibold">{p.name}</p>
          {p.brand && <p className="text-sm text-ink-2">{p.brand}</p>}
        </div>

        <div className="flex items-end gap-2">
          <label className="grid flex-1 gap-1">
            <span className="text-sm text-ink-2">Cantidad</span>
            <input
              data-autofocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
              aria-invalid={quantity === null ? true : undefined}
              className="num min-h-14 w-full rounded border border-rule bg-paper px-3 text-3xl aria-invalid:border-alert"
            />
          </label>
          <label className="grid gap-1">
            <span className="sr-only">Unidad o porción</span>
            <select
              value={mode}
              onChange={(e) => {
                const next = e.target.value;
                const np = p.portions.find((x) => x.id === next);
                if (quantity)
                  setAmount(fmtQty(np ? Math.round((quantity / np.amount) * 100) / 100 : quantity));
                setMode(next);
              }}
              className="min-h-14 rounded border border-rule bg-paper px-2"
            >
              <option value="base">{p.unit}</option>
              {p.portions.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} ({fmtQty(x.amount)} {p.unit})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Multiplicar">
          {(
            [
              ['½', 0.5],
              ['1×', 1],
              ['2×', 2],
            ] as const
          ).map(([l, f]) => (
            <Button
              key={l}
              variant="ghost"
              onClick={() => (f === 1 ? setAmount(portion ? '1' : '100') : scale(f))}
            >
              {l}
            </Button>
          ))}
        </div>

        <table className="num w-full text-sm" aria-label="Valores de esta cantidad">
          <thead>
            <tr className="text-xs text-ink-2">
              <th className="text-left font-normal">kcal</th>
              <th className="text-right font-normal">P</th>
              <th className="text-right font-normal">C</th>
              <th className="text-right font-normal">G</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{kcalText}</td>
              {(['protein_g', 'carbs_g', 'fat_g'] as const).map((k) => (
                <td key={k} className="text-right">
                  {live?.[k] == null ? '—' : `${fmtG(live[k])} g`}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        {quantity && portion && (
          <p className="num -mt-2 text-xs text-ink-2">
            = {fmtQty(quantity)} {p.unit}
          </p>
        )}

        <label className="grid gap-1">
          <span className="text-sm text-ink-2">Comida</span>
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            className="min-h-11 rounded border border-rule bg-paper px-3"
          >
            {p.slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <Button
          disabled={!quantity || p.busy}
          onClick={() =>
            quantity &&
            p.onConfirm({
              quantity,
              mealSlotId: slot,
              portion: portion ? { id: portion.id, name: portion.name, count: n! } : null,
            })
          }
        >
          {p.confirmLabel(kcalText)}
        </Button>
        {p.onDelete && (
          <Button variant="danger" className="mt-4" onClick={p.onDelete}>
            Eliminar registro
          </Button>
        )}
      </div>
    </Sheet>
  );
}

import { useState } from 'react';
import { trendAt } from '../../domain/trend';
import { fmtKg } from '../../lib/format';
import { useWeights } from './api';
import { WeightSheet } from './WeightSheet';

/** Tarjeta de peso en Hoy: peso del día, tendencia y origen. Tocarla abre H4. */
export function WeightCard({ day }: { day: string }) {
  const { data } = useWeights();
  const [open, setOpen] = useState(false);
  const todayRow = data?.rows.find((w) => w.day === day) ?? null;
  const last = data?.rows.at(-1) ?? null;
  const trend = data ? trendAt(data.trend, day) : null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="num flex min-h-11 w-full items-baseline justify-between gap-2 text-left text-sm"
      >
        {todayRow ? (
          <span>
            PESO {fmtKg(todayRow.weight_kg)} kg
            {trend !== null && <span className="text-ink-2"> · tend. {fmtKg(trend)}</span>}
            <span className="text-ink-2">
              {' '}
              · {todayRow.source === 'health' ? 'Salud ✓' : 'Manual'}
            </span>
          </span>
        ) : (
          <span className="text-ink-2">
            PESO — sin pesaje{last ? ` (último ${fmtKg(last.weight_kg)} kg)` : ''}
          </span>
        )}
        <span className="font-sans text-action">{todayRow ? 'Editar' : '+ Peso'}</span>
      </button>
      {open && (
        <WeightSheet
          day={day}
          initialKg={todayRow?.weight_kg ?? last?.weight_kg ?? null}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

import { useState } from 'react';
import { trendAt } from '../../domain/trend';
import { fmtKg } from '../../lib/format';
import { useWeights } from './api';
import { hoursSince, STALE_HOURS, useActiveToken, useActivity } from '../health/api';
import { WeightSheet } from './WeightSheet';

/** Tarjeta de peso en Hoy: peso del día, tendencia y origen. Tocarla abre H4. */
export function WeightCard({ day }: { day: string }) {
  const { data } = useWeights();
  const [open, setOpen] = useState(false);
  const activity = useActivity(day);
  const token = useActiveToken();
  const since = token.data ? hoursSince(token.data.last_used_at) : null;
  const stale = token.data && (since === null || since > STALE_HOURS);
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
      {(activity.data?.steps != null || stale) && (
        <p className="num text-xs text-ink-2">
          {activity.data?.steps != null &&
            `PASOS ${new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(activity.data.steps)} (informativo)`}
          {stale && (
            <span className="text-alert">
              {activity.data?.steps != null ? ' · ' : ''}Salud: sin sincronizar desde{' '}
              {token.data!.last_used_at
                ? new Date(token.data!.last_used_at).toLocaleDateString('es-ES')
                : 'el inicio'}
            </span>
          )}
        </p>
      )}
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

import { useState } from 'react';
import type { Totals } from '../../domain/nutrition';
import { fmtG, fmtKcal } from '../../lib/format';
import type { Targets } from '../profile/targets';

function Bar({
  label,
  value,
  max,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[1.25rem_6.5rem_1fr] items-center gap-2 text-sm">
      <span className="num">{label}</span>
      <span className="num text-right">
        {fmtKcal(value)}/{fmtKcal(max)} {unit}
      </span>
      <span
        role="progressbar"
        aria-label={label === 'P' ? 'Proteína' : label === 'C' ? 'Hidratos' : 'Grasa'}
        aria-valuemin={0}
        aria-valuemax={Math.round(max)}
        aria-valuenow={Math.round(value)}
        className="h-1.5 bg-paper-2"
      >
        <span
          className={`block h-full ${value > max ? 'bg-alert' : 'bg-ink'}`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}

/** Bloque RESTANTE (Design Brief §4). */
export function RemainingBlock({ targets, totals }: { targets: Targets; totals: Totals }) {
  const [more, setMore] = useState(false);
  const eaten = totals.totals.energy_kcal;
  const left = targets.kcal - eaten;
  const over = left < 0;
  const pct = Math.round((eaten / targets.kcal) * 100);

  return (
    <section aria-label="Resumen del día" className="grid gap-2">
      <p className="num text-xs tracking-[0.12em] text-ink-2">
        {over ? 'EXCESO' : 'RESTANTE'}
        {totals.isPartial && (
          <span title="Algunos productos no tienen todos los nutrientes" className="ml-2">
            ½ parcial
          </span>
        )}
      </p>
      <p
        className={`num text-[clamp(2.75rem,15vw,4rem)] leading-none ${over ? 'text-alert' : ''}`}
        data-testid="remaining"
      >
        {over ? `+${fmtKcal(-left)}` : fmtKcal(left)}
        <span className="ml-2 text-lg text-ink-2">kcal</span>
      </p>
      <div className="flex items-center gap-2">
        <span
          role="progressbar"
          aria-label="Kilocalorías"
          aria-valuemin={0}
          aria-valuemax={Math.round(targets.kcal)}
          aria-valuenow={Math.round(eaten)}
          className="h-0.5 flex-1 bg-rule"
        >
          <span
            className={`block h-full ${over ? 'bg-alert' : 'bg-ink'}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </span>
        <span className="num text-xs text-ink-2">{pct} %</span>
      </div>
      <p className="num text-xs text-ink-2">
        {fmtKcal(eaten)} de {fmtKcal(targets.kcal)} kcal
      </p>
      <Bar label="P" value={totals.totals.protein_g} max={targets.proteinG} unit="g" />
      <Bar label="C" value={totals.totals.carbs_g} max={targets.carbsG} unit="g" />
      <Bar label="G" value={totals.totals.fat_g} max={targets.fatG} unit="g" />
      <button
        type="button"
        aria-expanded={more}
        onClick={() => setMore(!more)}
        className="min-h-11 text-left text-sm text-ink-2"
      >
        {more ? '−' : '+'} fibra · azúcar · sal · sat.
      </button>
      {more && (
        <dl className="num grid grid-cols-2 gap-x-4 text-sm">
          {(
            [
              ['Fibra', 'fiber_g'],
              ['Azúcares', 'sugars_g'],
              ['Sal', 'salt_g'],
              ['Saturadas', 'saturated_fat_g'],
            ] as const
          ).map(([l, k]) => (
            <div key={k} className="flex justify-between">
              <dt>{l}</dt>
              <dd>
                {fmtG(totals.totals[k])} g{totals.partial[k] ? ' ½' : ''}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

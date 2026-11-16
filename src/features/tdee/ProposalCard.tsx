import { useState } from 'react';
import { fmtKcal, fmtKg } from '../../lib/format';
import { Leader } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/useToast';
import { useUserId } from '../auth/useAuth';
import { useDecideProposal, type ProposalRow } from './api';

/** H5 Detalle: la fórmula con los valores (Design Brief, principio 3). */
export function ProposalDetail({ p, onClose }: { p: ProposalRow; onClose: () => void }) {
  return (
    <Sheet title={`Semana del ${p.week_start}`} onClose={onClose}>
      <div className="num grid gap-1 text-sm">
        <Leader label="Días registrados" value={p.days_logged ?? '—'} />
        <Leader label="kcal media" value={p.kcal_avg == null ? '—' : fmtKcal(p.kcal_avg)} />
        <Leader
          label="Tendencia inicio"
          value={p.trend_start_kg == null ? '—' : `${fmtKg(p.trend_start_kg)} kg`}
        />
        <Leader
          label="Tendencia fin"
          value={p.trend_end_kg == null ? '—' : `${fmtKg(p.trend_end_kg)} kg`}
        />
        <Leader
          label="Δ tendencia"
          value={
            p.trend_delta_kg == null
              ? '—'
              : `${p.trend_delta_kg > 0 ? '+' : ''}${p.trend_delta_kg.toFixed(2).replace('.', ',')} kg`
          }
        />
        <hr className="my-2 border-0 border-t border-dashed border-rule" />
        <p className="text-xs text-ink-2">TDEE obs = kcal media − Δ × 7.700 / 7</p>
        <Leader label="TDEE observado" value={p.tdee_obs == null ? '—' : fmtKcal(p.tdee_obs)} />
        <p className="text-xs text-ink-2">Propuesto = 0,8 × actual + 0,2 × observado (±150)</p>
        <Leader label="TDEE actual" value={fmtKcal(p.tdee_before)} />
        <Leader
          label="TDEE propuesto"
          value={p.tdee_proposed == null ? '—' : fmtKcal(p.tdee_proposed)}
          strong
        />
        {p.clamped && <p className="text-xs">Límite de ±150 kcal aplicado.</p>}
        <Leader
          label="Objetivo propuesto"
          value={p.target_kcal_proposed == null ? '—' : `${fmtKcal(p.target_kcal_proposed)} kcal`}
          strong
        />
      </div>
    </Sheet>
  );
}

/** Tarjeta de propuesta invertida: se queda hasta que respondes. */
export function ProposalCard({ p }: { p: ProposalRow }) {
  const userId = useUserId();
  const toast = useToast();
  const decide = useDecideProposal(userId);
  const [detail, setDetail] = useState(false);
  const run = (accept: boolean) =>
    decide.mutate(
      { p, accept },
      {
        onSuccess: () =>
          toast({ message: accept ? 'Objetivo actualizado' : 'Propuesta rechazada' }),
        onError: (e) => toast({ message: `No se guardó: ${e.message}`, error: true }),
      },
    );
  return (
    <section aria-label="Propuesta de TDEE" className="grid gap-2 bg-ink p-3 text-paper">
      <p className="num">
        [!] TDEE {fmtKcal(p.tdee_before)} → {fmtKcal(p.tdee_proposed!)}
      </p>
      <p className="num text-sm">Objetivo nuevo: {fmtKcal(p.target_kcal_proposed!)} kcal</p>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className="min-h-11 rounded bg-paper font-semibold text-ink"
          disabled={decide.isPending}
          onClick={() => run(true)}
        >
          Aceptar
        </button>
        <button
          type="button"
          className="min-h-11 rounded border border-paper"
          disabled={decide.isPending}
          onClick={() => run(false)}
        >
          Rechazar
        </button>
        <button type="button" className="min-h-11 underline" onClick={() => setDetail(true)}>
          Detalle
        </button>
      </div>
      {detail && <ProposalDetail p={p} onClose={() => setDetail(false)} />}
    </section>
  );
}

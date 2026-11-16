import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
} from 'recharts';
import { addDays, mondayOf } from '../../domain/dates';
import { weeklyRate } from '../../domain/trend';
import { fmtKcal, fmtKg } from '../../lib/format';
import { useToday } from '../../lib/useToday';
import { Button, SectionTitle } from '../../ui/primitives';
import { useToast } from '../../ui/useToast';
import { startupProgress, useAdaptiveData, useProposals, type ProposalRow } from '../tdee/api';
import { ProposalCard, ProposalDetail } from '../tdee/ProposalCard';
import { useDeleteWeight, useWeights } from '../weight/api';
import { WeightSheet } from '../weight/WeightSheet';

type Range = 30 | 90 | 0;
const AXIS = { fontSize: 11, fontFamily: 'var(--mono)', fill: 'var(--ink-2)' };

const REASON: Record<string, string> = {
  arranque: 'arranque sin completar',
  'dias<5': 'menos de 5 días registrados',
  'sin pesaje': 'sin pesaje',
};

function statusText(p: ProposalRow) {
  switch (p.status) {
    case 'skipped':
      return `sin ajuste · ${REASON[p.skip_reason ?? ''] ?? p.skip_reason}`;
    case 'pending':
      return `pendiente · ${fmtKcal(p.tdee_proposed!)}`;
    case 'accepted':
      return `aceptada · ${fmtKcal(p.tdee_before)} → ${fmtKcal(p.tdee_proposed!)}`;
    case 'rejected':
      return `rechazada · ${fmtKcal(p.tdee_proposed!)}`;
    default:
      return `caducada · ${fmtKcal(p.tdee_proposed!)}`;
  }
}

/** T2 Progreso. */
export default function ProgressPage() {
  const today = useToday();
  const toast = useToast();
  const [range, setRange] = useState<Range>(30);
  const [weightSheet, setWeightSheet] = useState(false);
  const [detail, setDetail] = useState<ProposalRow | null>(null);
  const weights = useWeights();
  const proposals = useProposals();
  const adaptive = useAdaptiveData();
  const del = useDeleteWeight();

  const from = range ? addDays(today, -range + 1) : '0000-00-00';
  const points = useMemo(
    () =>
      (weights.data?.trend ?? [])
        .filter((p) => p.day >= from)
        .map((p) => ({
          t: Date.parse(`${p.day}T00:00:00Z`),
          kg: p.kg,
          trend: Math.round(p.trend * 100) / 100,
        })),
    [weights.data, from],
  );
  const rate = weights.data ? weeklyRate(weights.data.trend, today) : null;
  const pending = proposals.data?.find((p) => p.status === 'pending');
  const startup = adaptive.data ? startupProgress(adaptive.data, today) : null;

  // TDEE en escalones: aceptadas cambian el valor; rechazadas aparecen como puntos de guiones.
  const tdeeSteps = useMemo(() => {
    const rows = proposals.data ?? [];
    return rows
      .filter((p) => p.status !== 'skipped')
      .map((p) => ({
        t: Date.parse(`${addDays(p.week_start, 7)}T00:00:00Z`),
        actual: p.status === 'accepted' ? p.tdee_proposed : p.tdee_before,
        propuesta: p.tdee_proposed,
      }));
  }, [proposals.data]);

  // Adherencia: días registrados por semana (últimas 8).
  const adherence = useMemo(() => {
    if (!adaptive.data) return [];
    const out: { week: string; days: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const w = addDays(mondayOf(today), -7 * i);
      let n = 0;
      for (let d = 0; d < 7; d++) {
        const day = addDays(w, d);
        if (adaptive.data.dayKcal.has(day) && !adaptive.data.incomplete.has(day)) n++;
      }
      out.push({ week: w.slice(5), days: n });
    }
    return out;
  }, [adaptive.data, today]);

  const last = points.at(-1);
  const summary = last
    ? `Peso ${fmtKg(last.kg)} kg, tendencia ${fmtKg(last.trend)} kg${rate !== null ? `, ${rate > 0 ? '+' : ''}${fmtKg(rate)} kg en 7 días` : ''}.`
    : 'Sin pesos en este rango.';

  return (
    <div className="grid gap-6 py-4 sm:max-w-[720px]">
      <header className="flex items-center justify-between">
        <h1 className="num text-2xl">Progreso</h1>
        <Button variant="ghost" onClick={() => setWeightSheet(true)}>
          + Peso
        </Button>
      </header>

      {pending && <ProposalCard p={pending} />}

      <section aria-labelledby="peso" className="grid gap-2">
        <div className="flex items-center justify-between">
          <SectionTitle id="peso">Peso y tendencia</SectionTitle>
          <div role="group" aria-label="Rango" className="flex gap-1">
            {([30, 90, 0] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={`num min-h-11 px-2 text-xs ${range === r ? 'underline underline-offset-4' : 'text-ink-2'}`}
              >
                {r ? `${r} D` : 'TODO'}
              </button>
            ))}
          </div>
        </div>
        <p className="num text-sm" aria-live="polite">
          {summary}
        </p>
        {points.length > 1 ? (
          <div className="h-56" aria-hidden>
            <ResponsiveContainer>
              <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="var(--rule)" strokeDasharray="1 3" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tick={AXIS}
                  tickFormatter={(t: number) =>
                    new Date(t).toISOString().slice(5, 10).split('-').reverse().join('/')
                  }
                  stroke="var(--rule)"
                />
                <YAxis
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tick={AXIS}
                  stroke="var(--rule)"
                  tickFormatter={(v: number) => v.toFixed(1)}
                />
                <Scatter dataKey="kg" fill="var(--ink-2)" r={2} isAnimationActive={false} />
                <Line
                  dataKey="trend"
                  stroke="var(--ink)"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-ink-2">Registra al menos dos pesos para ver la gráfica.</p>
        )}
      </section>

      <section aria-labelledby="tdee" className="grid gap-2">
        <SectionTitle id="tdee">TDEE adaptativo</SectionTitle>
        {startup && !startup.met && (
          <p className="text-sm">
            El TDEE adaptativo empieza tras {startup.need.days} días con {startup.need.loggedDays}{' '}
            días registrados y {startup.need.weighIns} pesajes. Llevas{' '}
            <span className="num">
              {Math.min(startup.days, 99)} / {startup.logged} / {startup.weighIns}
            </span>
            .
          </p>
        )}
        {tdeeSteps.length > 0 && (
          <div className="h-40" aria-hidden>
            <ResponsiveContainer>
              <LineChart data={tdeeSteps} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid stroke="var(--rule)" strokeDasharray="1 3" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tick={AXIS}
                  stroke="var(--rule)"
                  tickFormatter={(t: number) =>
                    new Date(t).toISOString().slice(5, 10).split('-').reverse().join('/')
                  }
                />
                <YAxis
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tick={AXIS}
                  stroke="var(--rule)"
                />
                <Line
                  type="stepAfter"
                  dataKey="actual"
                  stroke="var(--ink)"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="stepAfter"
                  dataKey="propuesta"
                  stroke="var(--ink-2)"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <ul className="divide-y divide-dashed divide-rule text-sm">
          {[...(proposals.data ?? [])].reverse().map((p) => (
            <li key={p.id}>
              <button
                type="button"
                disabled={p.status === 'skipped'}
                onClick={() => setDetail(p)}
                className="flex min-h-11 w-full justify-between gap-2 text-left disabled:cursor-default"
              >
                <span className="num">
                  Sem. {p.week_start.slice(5).split('-').reverse().join('/')}
                </span>
                <span className="text-ink-2">{statusText(p)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="adh" className="grid gap-2">
        <SectionTitle id="adh">Adherencia (días registrados por semana)</SectionTitle>
        <ol className="num flex items-end gap-1 text-xs">
          {adherence.map((a) => (
            <li
              key={a.week}
              className="grid flex-1 justify-items-center gap-1"
              aria-label={`Semana ${a.week}: ${a.days} de 7 días`}
            >
              <span className="w-full bg-ink" style={{ height: `${a.days * 8}px` }} />
              <span>{a.days}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="lista" className="grid gap-2">
        <SectionTitle id="lista">Pesos</SectionTitle>
        <ul className="divide-y divide-dashed divide-rule">
          {[...(weights.data?.rows ?? [])]
            .reverse()
            .slice(0, 60)
            .map((w) => (
              <li key={w.id} className="flex min-h-11 items-center gap-2">
                <span className="num">{w.day.split('-').reverse().join('/')}</span>
                <span aria-hidden className="leader min-w-4 flex-1" />
                <span className="num">{fmtKg(w.weight_kg)} kg</span>
                <span className="w-14 text-xs text-ink-2">
                  {w.source === 'health' ? 'Salud' : 'Manual'}
                </span>
                <button
                  type="button"
                  aria-label={`Borrar peso del ${w.day}`}
                  className="grid size-11 place-items-center text-ink-2"
                  onClick={() =>
                    del.mutate(w.id, {
                      onError: (e) => toast({ message: `No se borró: ${e.message}`, error: true }),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
        </ul>
      </section>

      {weightSheet && (
        <WeightSheet
          day={today}
          initialKg={weights.data?.rows.at(-1)?.weight_kg ?? null}
          onClose={() => setWeightSheet(false)}
        />
      )}
      {detail && <ProposalDetail p={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

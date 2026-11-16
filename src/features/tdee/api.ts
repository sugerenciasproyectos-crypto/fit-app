import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  evaluatePending,
  pendingWeeks,
  startupMet,
  STARTUP,
  type AdaptiveData,
  type WeekResult,
} from '../../domain/adaptive';
import { addDays, diffDays, madridDay, mondayOf, type Day } from '../../domain/dates';
import { computeTrend } from '../../domain/trend';
import { supabase, type Tables } from '../../lib/supabase';
import { profileKey, type Profile } from '../profile/api';

export type ProposalRow = Tables<'tdee_proposals'>;
export const proposalsKey = ['tdee_proposals'] as const;
export const adaptiveKey = ['adaptive_data'] as const;

/** Datos para el TDEE adaptativo: kcal por día, días incompletos y pesos con su tendencia. */
export async function loadAdaptiveData(): Promise<AdaptiveData & { firstDay: Day | null }> {
  const [diary, flags, weights] = await Promise.all([
    supabase.from('diary_entries').select('day, energy_kcal'),
    supabase.from('day_flags').select('day').eq('incomplete', true),
    supabase.from('weights').select('day, weight_kg').order('day'),
  ]);
  for (const r of [diary, flags, weights]) if (r.error) throw r.error;
  const dayKcal = new Map<Day, number>();
  for (const e of diary.data!) dayKcal.set(e.day, (dayKcal.get(e.day) ?? 0) + (e.energy_kcal ?? 0));
  const days = [...dayKcal.keys()].sort();
  return {
    dayKcal,
    incomplete: new Set(flags.data!.map((f) => f.day)),
    weighIns: weights.data!.map((w) => w.day),
    trend: computeTrend(weights.data!.map((w) => ({ day: w.day, kg: w.weight_kg }))),
    firstDay: days[0] ?? null,
  };
}

export function useAdaptiveData() {
  return useQuery({ queryKey: adaptiveKey, queryFn: loadAdaptiveData });
}

export function useProposals() {
  return useQuery({
    queryKey: proposalsKey,
    queryFn: async (): Promise<ProposalRow[]> => {
      const { data, error } = await supabase.from('tdee_proposals').select('*').order('week_start');
      if (error) throw error;
      return data;
    },
  });
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function toRow(userId: string, r: WeekResult) {
  const base = {
    user_id: userId,
    week_start: r.weekStart,
    status: r.status,
    days_logged: r.daysLogged,
    tdee_before: r1(r.tdeeBefore),
  };
  if (r.status === 'skipped') return { ...base, skip_reason: r.skipReason };
  return {
    ...base,
    kcal_avg: r1(r.kcalAvg),
    trend_start_kg: Math.round(r.trendStartKg * 100) / 100,
    trend_end_kg: Math.round(r.trendEndKg * 100) / 100,
    trend_delta_kg: Math.round(r.trendDeltaKg * 100) / 100,
    tdee_obs: r1(r.tdeeObs),
    tdee_proposed: r1(r.tdeeProposed),
    clamped: r.clamped,
    target_kcal_proposed: r1(r.targetKcalProposed),
  };
}

/**
 * Evaluación semanal (App Flow §4.6): evalúa las semanas cerradas sin evaluar.
 * Si aparece una propuesta nueva, la pendiente anterior caduca.
 */
export async function runWeeklyEvaluation(userId: string, profile: Profile, today: Day) {
  const { data: last, error } = await supabase
    .from('tdee_proposals')
    .select('week_start')
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const d = await loadAdaptiveData();
  const first = d.firstDay ?? profile.tracking_start;
  const start = first < profile.tracking_start ? first : profile.tracking_start;
  // Nunca antes del inicio del seguimiento (evita evaluar años vacíos).
  const weeks = pendingWeeks(last?.week_start ?? null, start, today).filter(
    (w) => w >= mondayOf(start),
  );
  if (!weeks.length) return 0;
  const results = evaluatePending(weeks, d, {
    tdee: profile.tdee_current,
    adjust: profile.kcal_adjust,
    sex: profile.sex,
  });
  if (results.some((r) => r.status === 'pending')) {
    const { error: e } = await supabase
      .from('tdee_proposals')
      .update({ status: 'expired' })
      .eq('status', 'pending');
    if (e) throw e;
  }
  const { error: e2 } = await supabase.from('tdee_proposals').upsert(
    results.map((r) => toRow(userId, r)),
    { onConflict: 'user_id,week_start' },
  );
  if (e2) throw e2;
  return results.length;
}

/** Se ejecuta una vez al abrir la app. */
export function useWeeklyEvaluation(userId: string, profile: Profile | null | undefined) {
  const qc = useQueryClient();
  const done = useRef(false);
  useEffect(() => {
    if (!profile || done.current) return;
    done.current = true;
    runWeeklyEvaluation(userId, profile, madridDay(new Date()))
      .then((n) => {
        if (n) void qc.invalidateQueries({ queryKey: proposalsKey });
      })
      .catch(() => {
        done.current = false; // se reintenta en la próxima apertura
      });
  }, [userId, profile, qc]);
}

export function useDecideProposal(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ p, accept }: { p: ProposalRow; accept: boolean }) => {
      if (accept) {
        const { error } = await supabase
          .from('profiles')
          .update({ tdee_current: p.tdee_proposed! })
          .eq('user_id', userId);
        if (error) throw error;
      }
      const { error } = await supabase
        .from('tdee_proposals')
        .update({ status: accept ? 'accepted' : 'rejected', decided_at: new Date().toISOString() })
        .eq('id', p.id);
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: proposalsKey });
      qc.invalidateQueries({ queryKey: profileKey });
    },
  });
}

/** Progreso del arranque (Design Brief §5): días transcurridos, días registrados y pesajes. */
export function startupProgress(d: AdaptiveData & { firstDay: Day | null }, today: Day) {
  const span = d.firstDay ? diffDays(today, d.firstDay) + 1 : 0;
  const logged = [...d.dayKcal.keys()].filter((x) => !d.incomplete.has(x)).length;
  return {
    met: startupMet(d, today) || startupMet(d, addDays(today, -1)),
    days: Math.max(0, span),
    logged,
    weighIns: d.weighIns.length,
    need: STARTUP,
  };
}

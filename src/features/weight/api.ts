import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { computeTrend, type TrendPoint } from '../../domain/trend';
import { supabase, type Tables } from '../../lib/supabase';
import { lastWeightKey } from '../profile/api';

export type WeightRow = Tables<'weights'>;
export const weightsKey = ['weights', 'all'] as const;

/** Todos los pesos del día, ordenados, con su tendencia EMA (TRD §7.6). */
export function useWeights() {
  return useQuery({
    queryKey: weightsKey,
    queryFn: async (): Promise<{ rows: WeightRow[]; trend: TrendPoint[] }> => {
      const { data, error } = await supabase.from('weights').select('*').order('day');
      if (error) throw error;
      return {
        rows: data,
        trend: computeTrend(data.map((w) => ({ day: w.day, kg: w.weight_kg }))),
      };
    },
  });
}

/** Peso manual: upsert con source = manual, que siempre manda sobre Salud. */
export function useSaveWeight(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ day, kg }: { day: string; kg: number }) => {
      const { error } = await supabase.from('weights').upsert(
        {
          user_id: userId,
          day,
          weight_kg: kg,
          source: 'manual',
          measured_at: new Date().toISOString(),
          sample_id: null,
        },
        { onConflict: 'user_id,day' },
      );
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: weightsKey });
      qc.invalidateQueries({ queryKey: lastWeightKey });
      qc.invalidateQueries({ queryKey: ['adaptive_data'] });
    },
  });
}

export function useDeleteWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weights').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: weightsKey });
      qc.invalidateQueries({ queryKey: lastWeightKey });
      qc.invalidateQueries({ queryKey: ['adaptive_data'] });
    },
  });
}

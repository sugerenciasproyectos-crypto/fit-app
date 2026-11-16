import { useQuery } from '@tanstack/react-query';
import { supabase, type Tables } from '../../lib/supabase';

export type Profile = Tables<'profiles'>;
export type Weight = Tables<'weights'>;

export const profileKey = ['profile'] as const;
export const lastWeightKey = ['weights', 'last'] as const;

export function useProfile() {
  return useQuery({
    queryKey: profileKey,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useLastWeight() {
  return useQuery({
    queryKey: lastWeightKey,
    queryFn: async (): Promise<Weight | null> => {
      const { data, error } = await supabase
        .from('weights')
        .select('*')
        .order('day', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

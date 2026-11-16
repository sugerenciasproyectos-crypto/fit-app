import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export const tokenKey = ['api_token'] as const;
export const SHORTCUT_NAME = 'Sync Salud';
export const SHORTCUT_URL = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}`;
export const STALE_HOURS = 48;

export interface TokenInfo {
  id: string;
  label: string;
  last_used_at: string | null;
  created_at: string;
}

/** Token activo (sin el hash, que el cliente no puede leer). */
export function useActiveToken() {
  return useQuery({
    queryKey: tokenKey,
    queryFn: async (): Promise<TokenInfo | null> => {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('id, label, last_used_at, created_at')
        .is('revoked_at', null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function hoursSince(iso: string | null, now = Date.now()): number | null {
  return iso ? (now - Date.parse(iso)) / 3_600_000 : null;
}

export function useActivity(day: string) {
  return useQuery({
    queryKey: ['daily_activity', day],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_activity')
        .select('steps, active_kcal')
        .eq('day', day)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useDirtyEntries() {
  return useQuery({
    queryKey: ['export_dirty'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('id, day, product_name, quantity, unit, energy_kcal, exported_at')
        .eq('export_dirty', true)
        .order('day', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

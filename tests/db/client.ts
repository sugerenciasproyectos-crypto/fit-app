import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/db.types';
import { env } from './env';

export type Client = ReturnType<typeof createClient<Database>>;

export async function signIn(tag: 'A' | 'B'): Promise<{ db: Client; id: string }> {
  const db = createClient<Database>(env('VITE_SUPABASE_URL'), env('VITE_SUPABASE_ANON_KEY'), {
    auth: { persistSession: false },
  });
  const { data, error } = await db.auth.signInWithPassword({
    email: env(`TEST_${tag}_EMAIL`),
    password: env(`TEST_${tag}_PASSWORD`),
  });
  if (error) throw error;
  return { db, id: data.user.id };
}

import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Button, TextField } from '../../ui/primitives';
import { useAuth } from './useAuth';

export default function LoginPage() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : `No se pudo entrar: ${error.message}`,
      );
    }
  }

  return (
    <main className="pt-safe mx-auto grid min-h-dvh max-w-sm content-center gap-6 px-4">
      <div>
        <p className="num text-xs tracking-[0.12em] text-ink-2">TICKET DE CALORÍAS</p>
        <h1 className="num text-3xl">Entrar</h1>
      </div>
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy || !email || !password}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}

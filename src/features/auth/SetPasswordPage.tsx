import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Button, TextField } from '../../ui/primitives';
import { useAuth } from './useAuth';

/**
 * Fijar contraseña al llegar desde el email de invitación o de recuperación.
 * supabase-js abre la sesión con el enlace (detectSessionInUrl) y aquí se guarda la contraseña.
 */
export default function SetPasswordPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (!session) {
    return (
      <main className="pt-safe mx-auto grid min-h-dvh max-w-sm content-center gap-4 px-4">
        <h1 className="num text-2xl">Enlace caducado</h1>
        <p className="text-sm">
          El enlace no es válido o ya se usó. En la pantalla de entrada pulsa «He olvidado mi
          contraseña» para recibir otro.
        </p>
        <Link to="/login" className="text-action underline">
          Ir a entrar
        </Link>
      </main>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError('Mínimo 8 caracteres.');
    if (password !== repeat) return setError('Las contraseñas no coinciden.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(`No se guardó: ${error.message}`);
    navigate('/', { replace: true });
  }

  return (
    <main className="pt-safe mx-auto grid min-h-dvh max-w-sm content-center gap-6 px-4">
      <div>
        <p className="num text-xs tracking-[0.12em] text-ink-2">{session.user.email}</p>
        <h1 className="num text-3xl">Elige tu contraseña</h1>
      </div>
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <TextField
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Repítela"
          type="password"
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy || !password}>
          {busy ? 'Guardando…' : 'Guardar y entrar'}
        </Button>
      </form>
    </main>
  );
}

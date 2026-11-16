import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { fmtKcal, fmtQty } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { Button, SectionTitle } from '../../ui/primitives';
import { useToast } from '../../ui/useToast';
import {
  hoursSince,
  SHORTCUT_NAME,
  SHORTCUT_URL,
  tokenKey,
  useActiveToken,
  useDirtyEntries,
} from './api';

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-sync`;

function when(iso: string | null) {
  if (!iso) return 'nunca';
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Madrid',
  }).format(new Date(iso));
}

/** D7 Salud: token, guía del atajo y "Sincronizar ahora". */
export default function HealthPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const token = useActiveToken();
  const dirty = useDirtyEntries();
  const [fresh, setFresh] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const stale = (hoursSince(token.data?.last_used_at ?? null) ?? Infinity) > 48;

  async function generate() {
    const { data, error } = await supabase.rpc('create_api_token');
    if (error) return toast({ message: `No se generó: ${error.message}`, error: true });
    setFresh(data);
    await qc.invalidateQueries({ queryKey: tokenKey });
  }

  async function revoke() {
    const { error } = await supabase.rpc('revoke_api_token');
    if (error) return toast({ message: `No se revocó: ${error.message}`, error: true });
    setFresh(null);
    setConfirmRevoke(false);
    await qc.invalidateQueries({ queryKey: tokenKey });
    toast({ message: 'Token revocado' });
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ message: `${what} copiado` });
    } catch {
      toast({ message: 'No se pudo copiar; selecciónalo a mano', error: true });
    }
  }

  return (
    <div className="grid gap-6 py-4">
      <header className="flex items-baseline justify-between">
        <h1 className="num text-2xl">Apple Salud</h1>
        <Link to="/ajustes" className="text-action underline">
          Ajustes
        </Link>
      </header>

      <section className="grid gap-2" aria-labelledby="sync">
        <SectionTitle id="sync">Sincronización</SectionTitle>
        <p className={`text-sm ${token.data && stale ? 'text-alert' : ''}`}>
          Última sincronización: {when(token.data?.last_used_at ?? null)}
          {token.data && stale && ' — hace más de 48 h'}
        </p>
        <a
          href={SHORTCUT_URL}
          onClick={() => {
            try {
              sessionStorage.setItem('sync-pending', '1');
            } catch {
              /* sin almacenamiento */
            }
          }}
          className="flex min-h-11 items-center justify-center rounded bg-action text-action-ink"
        >
          Sincronizar con Salud
        </a>
        <p className="text-xs text-ink-2">
          Abre el atajo «{SHORTCUT_NAME}». Importa peso y pasos de los últimos 7 días y escribe tus
          comidas en Salud.
        </p>
      </section>

      <section className="grid gap-2" aria-labelledby="tok">
        <SectionTitle id="tok">Token del atajo</SectionTitle>
        {fresh ? (
          <div className="grid gap-2 border border-ink p-3">
            <p className="text-sm font-semibold">Cópialo ahora: no se volverá a mostrar.</p>
            <code className="num block text-xs break-all select-all">{fresh}</code>
            <Button onClick={() => void copy(fresh, 'Token')}>Copiar token</Button>
          </div>
        ) : token.data ? (
          <p className="text-sm">
            Token activo desde {when(token.data.created_at)}. Si lo pierdes, genera otro (el
            anterior deja de funcionar).
          </p>
        ) : (
          <p className="text-sm text-ink-2">Aún no hay token.</p>
        )}
        <Button variant="ghost" onClick={() => void generate()}>
          {token.data ? 'Generar uno nuevo' : 'Generar token'}
        </Button>
        <p className="text-xs text-ink-2">
          Dirección del atajo: <code className="num break-all">{ENDPOINT}</code>{' '}
          <button
            type="button"
            className="text-action underline"
            onClick={() => void copy(ENDPOINT, 'Dirección')}
          >
            copiar
          </button>
        </p>
      </section>

      <section className="grid gap-2" aria-labelledby="dirty">
        <SectionTitle id="dirty">Editados tras exportar</SectionTitle>
        <p className="text-xs text-ink-2">
          Los atajos no pueden borrar datos de Salud: estos registros cambiaron después de
          exportarse y Salud conserva el valor antiguo.
        </p>
        {dirty.data?.length ? (
          <ul className="divide-y divide-dashed divide-rule text-sm">
            {dirty.data.map((e) => (
              <li key={e.id} className="flex min-h-11 items-baseline gap-1">
                <span className="num">{e.day.split('-').reverse().join('/')}</span>
                <span className="truncate">
                  {' '}
                  {e.product_name} {fmtQty(e.quantity)} {e.unit}
                </span>
                <span aria-hidden className="leader min-w-4 flex-1" />
                <span className="num">{e.energy_kcal == null ? '—' : fmtKcal(e.energy_kcal)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-2">Ninguno.</p>
        )}
      </section>

      {token.data && (
        <section className="mt-6 grid gap-2">
          {confirmRevoke ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setConfirmRevoke(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => void revoke()}>
                Revocar
              </Button>
            </div>
          ) : (
            <Button variant="danger" onClick={() => setConfirmRevoke(true)}>
              Revocar token
            </Button>
          )}
        </section>
      )}
    </div>
  );
}

import { useQueryClient } from '@tanstack/react-query';
import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { MAX_BYTES, parseInterchangeText } from '../../../packages/schemas/src';
import type { Json } from '../../lib/db.types';
import { supabase } from '../../lib/supabase';
import { Button, Leader, SectionTitle } from '../../ui/primitives';
import { useToast } from '../../ui/useToast';
import { useUserId } from '../auth/useAuth';
import { profileKey, useProfile } from '../profile/api';
import { backupToZip, download } from './csv';
import { buildBackup } from './export';

const KEYS = [
  ['profile', 'Perfil'],
  ['meal_slots', 'Comidas del día'],
  ['supermarkets', 'Supermercados'],
  ['products', 'Productos'],
  ['recipes', 'Recetas'],
  ['saved_meals', 'Comidas guardadas'],
  ['diary', 'Registros del diario'],
  ['day_flags', 'Días incompletos'],
  ['weights', 'Pesos'],
  ['daily_activity', 'Actividad'],
  ['tdee_history', 'Historial del TDEE'],
] as const;

/** D8 Copia de seguridad y exportar. */
export default function BackupPage() {
  const userId = useUserId();
  const qc = useQueryClient();
  const toast = useToast();
  const profile = useProfile();
  const [busy, setBusy] = useState(false);
  const [restore, setRestore] = useState<{
    payload: Record<string, unknown>;
    counts: [string, number][];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markBackup() {
    await supabase
      .from('profiles')
      .update({ last_backup_at: new Date().toISOString() })
      .eq('user_id', userId);
    await qc.invalidateQueries({ queryKey: profileKey });
  }

  async function exportJson() {
    setBusy(true);
    try {
      const b = await buildBackup(supabase);
      download(
        JSON.stringify(b, null, 2),
        `calorias-backup-${new Date().toISOString().slice(0, 10)}.json`,
        'application/json',
      );
      await markBackup();
      toast({ message: 'Copia de seguridad descargada' });
    } catch (e) {
      toast({ message: `No se exportó: ${(e as Error).message}`, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    setBusy(true);
    try {
      const b = await buildBackup(supabase);
      download(
        backupToZip(b) as unknown as BlobPart,
        `calorias-csv-${new Date().toISOString().slice(0, 10)}.zip`,
        'application/zip',
      );
      toast({ message: 'CSV descargados' });
    } catch (e) {
      toast({ message: `No se exportó: ${(e as Error).message}`, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) return setError('El archivo supera 5 MB');
    const text = await f.text();
    const r = parseInterchangeText(text);
    if (!r.ok) return setError(r.errors.map((x) => `${x.path}: ${x.message}`).join('\n'));
    const payload = JSON.parse(text) as Record<string, unknown>;
    const counts = KEYS.map(([k, label]) => {
      const v = payload[k];
      return [label, Array.isArray(v) ? v.length : v ? 1 : 0] as [string, number];
    }).filter(([, n]) => n > 0);
    setRestore({ payload, counts });
  }

  async function doRestore() {
    if (!restore) return;
    setBusy(true);
    const { error: err } = await supabase.rpc('restore_backup', {
      payload: restore.payload as unknown as Json,
    });
    setBusy(false);
    if (err) return toast({ message: `No se restauró nada: ${err.message}`, error: true });
    await qc.invalidateQueries();
    setRestore(null);
    toast({ message: 'Copia restaurada' });
  }

  const last = profile.data?.last_backup_at;
  return (
    <div className="grid gap-6 py-4">
      <header className="flex items-baseline justify-between">
        <h1 className="num text-2xl">Copia de seguridad</h1>
        <Link to="/ajustes" className="text-action underline">
          Ajustes
        </Link>
      </header>
      <p className="text-sm">
        Última copia:{' '}
        {last ? new Date(last).toLocaleDateString('es-ES', { dateStyle: 'medium' }) : 'nunca'}.
        Guárdala fuera del móvil (iCloud Drive, correo…).
      </p>
      <section className="grid gap-2">
        <SectionTitle>Exportar</SectionTitle>
        <Button onClick={() => void exportJson()} disabled={busy}>
          Descargar copia (JSON)
        </Button>
        <Button variant="ghost" onClick={() => void exportCsv()} disabled={busy}>
          Descargar CSV (.zip) para Excel
        </Button>
      </section>

      <section className="mt-6 grid gap-2">
        <SectionTitle>Restaurar</SectionTitle>
        <p className="text-xs text-ink-2">
          Los datos de la copia sustituyen a los que tengan el mismo identificador. No se borra nada
          que no esté en la copia.
        </p>
        <label className="flex min-h-11 items-center justify-center rounded border border-alert text-alert">
          Elegir copia (.json)
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={onFile}
          />
        </label>
        {error && <pre className="num text-xs whitespace-pre-wrap text-alert">{error}</pre>}
        {restore && (
          <div className="grid gap-2 border border-alert p-3">
            <p className="font-semibold">Se restaurará:</p>
            {restore.counts.map(([label, n]) => (
              <Leader key={label} label={label} value={n} />
            ))}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setRestore(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => void doRestore()} disabled={busy}>
                Restaurar
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

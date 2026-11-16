import { useState } from 'react';
import { addDays } from '../../domain/dates';
import { supabase } from '../../lib/supabase';
import { Button, SelectField, TextField } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { copyEntries } from '../meals/api';
import type { Entry, MealSlot } from './api';

/** Copiar una comida o un día anterior al día abierto (tarea 7.4). */
export function CopySheet({
  userId,
  day,
  slots,
  onDone,
  onClose,
}: {
  userId: string;
  day: string;
  slots: MealSlot[];
  onDone: (rows: Entry[]) => void;
  onClose: () => void;
}) {
  const [from, setFrom] = useState(addDays(day, -1));
  const [slot, setSlot] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      let q = supabase.from('diary_entries').select('*').eq('day', from);
      if (slot) q = q.eq('meal_slot_id', slot);
      const { data, error: e } = await q.order('logged_at');
      if (e) throw e;
      if (!data.length) {
        setError('No hay registros que copiar en esa fecha.');
        setBusy(false);
        return;
      }
      onDone(await copyEntries(userId, data, day, null));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Sheet title="Copiar registros" onClose={onClose}>
      <div className="grid gap-4">
        <TextField
          label="Desde el día"
          type="date"
          max={day}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <SelectField label="Comida" value={slot} onChange={(e) => setSlot(e.target.value)}>
          <option value="">Todo el día</option>
          {slots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <p className="text-xs text-ink-2">Se copian con los valores actuales de cada producto.</p>
        {error && <p className="text-sm text-alert">{error}</p>}
        <Button onClick={run} disabled={busy || from === day}>
          {busy ? 'Copiando…' : 'Copiar aquí'}
        </Button>
      </div>
    </Sheet>
  );
}

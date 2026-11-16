import { useState } from 'react';
import { fmtKg, parseDecimal } from '../../lib/format';
import { Button, TextField } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/useToast';
import { useUserId } from '../auth/useAuth';
import { useSaveWeight } from './api';

/** H4 Peso del día (manual). */
export function WeightSheet({
  day,
  initialKg,
  onClose,
}: {
  day: string;
  initialKg: number | null;
  onClose: () => void;
}) {
  const userId = useUserId();
  const toast = useToast();
  const save = useSaveWeight(userId);
  const [kg, setKg] = useState(initialKg ? fmtKg(initialKg) : '');
  const [date, setDate] = useState(day);
  const value = parseDecimal(kg);
  const valid = value !== null && value >= 30 && value <= 300;

  return (
    <Sheet title="Peso del día" onClose={onClose}>
      <div className="grid gap-4">
        <TextField
          data-autofocus
          label="Peso"
          inputMode="decimal"
          suffix="kg"
          value={kg}
          error={kg && !valid ? 'Entre 30 y 300 kg' : undefined}
          onChange={(e) => setKg(e.target.value)}
        />
        <TextField
          label="Fecha"
          type="date"
          max={day}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <p className="text-xs text-ink-2">El peso manual manda sobre el de Salud ese día.</p>
        <Button
          disabled={!valid || save.isPending}
          onClick={() =>
            save.mutate(
              { day: date, kg: value! },
              {
                onSuccess: () => {
                  toast({ message: `Peso guardado · ${fmtKg(value!)} kg` });
                  onClose();
                },
                onError: (e) => toast({ message: `No se guardó: ${e.message}`, error: true }),
              },
            )
          }
        >
          Guardar
        </Button>
      </div>
    </Sheet>
  );
}

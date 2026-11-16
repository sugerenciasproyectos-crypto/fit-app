import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fmtKcal } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { Button, TextField } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/useToast';
import { correctionPreview, type CorrectionPreview as Preview } from './api';

/** Diálogo "aplicar corrección a registros anteriores" (TRD §7.4). */
export function CorrectionSheet({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    correctionPreview(productId, from, to)
      .then((p) => alive && setPreview(p))
      .catch(() => alive && setPreview(null));
    return () => {
      alive = false;
    };
  }, [productId, from, to]);

  async function apply() {
    setBusy(true);
    const { error } = await supabase.rpc('apply_product_correction', {
      p_product: productId,
      p_from: from || undefined,
      p_to: to || undefined,
    });
    setBusy(false);
    if (error) return toast({ message: `No se aplicó: ${error.message}`, error: true });
    await qc.invalidateQueries({ queryKey: ['diary'] });
    toast({ message: `Corrección aplicada a ${preview?.rows ?? 0} registros` });
    onClose();
  }

  return (
    <Sheet title="Aplicar a registros anteriores" onClose={onClose}>
      <div className="grid gap-4">
        <p className="text-sm">
          Los registros guardan los valores del momento. ¿Quieres recalcularlos con los valores
          nuevos?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <TextField
            label="Desde (opcional)"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <TextField
            label="Hasta (opcional)"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <p className="num text-sm" aria-live="polite">
          {preview
            ? `${preview.rows} registros · ${preview.kcal_delta > 0 ? '+' : ''}${fmtKcal(preview.kcal_delta)} kcal`
            : 'Calculando…'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onClose}>
            No, dejarlos
          </Button>
          <Button onClick={apply} disabled={busy || !preview?.rows}>
            Aplicar
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

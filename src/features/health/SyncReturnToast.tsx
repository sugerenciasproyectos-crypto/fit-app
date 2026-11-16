import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useToast } from '../../ui/useToast';

/**
 * Al volver a la app desde el atajo (pestaña visible otra vez), se refrescan peso, pasos y
 * registros y se avisa con un toast (tarea 10.5).
 */
export function SyncReturnToast() {
  const qc = useQueryClient();
  const toast = useToast();
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === 'hidden') hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 3000) {
        hiddenAt = 0;
        void qc.invalidateQueries();
        if (sessionStorage.getItem('sync-pending')) {
          sessionStorage.removeItem('sync-pending');
          toast({ message: 'Datos de Salud actualizados' });
        }
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [qc, toast]);
  return null;
}

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastInput } from './useToast';

/** Franja de ticket en la parte inferior, 5 s, con acción opcional (DESHACER / REINTENTAR). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastInput & { id: number }) | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((t: ToastInput) => {
    window.clearTimeout(timer.current);
    const id = Date.now();
    setToast({ ...t, id });
    timer.current = window.setTimeout(() => setToast((c) => (c?.id === id ? null : c)), 5000);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 px-4">
        {toast && (
          <div
            className={`num pointer-events-auto mx-auto flex max-w-[448px] items-center justify-between gap-3 border-y border-dashed px-3 py-2 text-sm ${
              toast.error ? 'border-alert bg-paper text-alert' : 'border-ink bg-ink text-paper'
            }`}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="min-h-11 font-semibold tracking-wider uppercase underline"
                onClick={() => {
                  toast.action!.run();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

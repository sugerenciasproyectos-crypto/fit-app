import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

/** Hoja inferior (H1, H2, H4…): sube desde abajo, se cierra con Cerrar, Escape o el fondo. */
export function Sheet({
  title,
  onClose,
  children,
  tall = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  tall?: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const first =
      root?.querySelector<HTMLElement>('[data-autofocus]') ??
      root?.querySelector<HTMLElement>('input, select, button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`sheet-in pb-safe absolute inset-x-0 bottom-0 mx-auto flex max-w-[480px] flex-col border-t border-dashed border-ink bg-paper ${
          tall ? 'h-[90dvh]' : 'max-h-[90dvh]'
        }`}
      >
        <header className="flex items-center justify-between px-4 pt-3">
          <h2 id={id} className="num text-sm tracking-[0.12em] uppercase">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-11 place-items-center"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}

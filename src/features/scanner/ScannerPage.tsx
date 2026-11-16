import { X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Button, TextField } from '../../ui/primitives';
import { useUserId } from '../auth/useAuth';
import { lookupBarcode } from '../external/cache';

type State = 'starting' | 'scanning' | 'denied' | 'unsupported' | 'looking' | { error: string };

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

/** H3 Escáner: BarcodeDetector si existe, ZXing si no. "Escribir código" siempre visible. */
export default function ScannerPage() {
  const navigate = useNavigate();
  const userId = useUserId();
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>('starting');
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const done = useRef(false);

  async function resolve(raw: string) {
    if (done.current) return;
    const c = raw.replace(/\D/g, '');
    if (!/^\d{6,14}$/.test(c)) return;
    done.current = true;
    try {
      navigator.vibrate?.(15);
    } catch {
      /* iOS */
    }
    setState('looking');
    try {
      const r = await lookupBarcode(supabase, userId, c);
      if (r.kind === 'not_found')
        navigate(`/productos/nuevo?codigo=${c}&noencontrado=1`, { replace: true });
      else navigate(`/?producto=${r.product.id}`, { replace: true });
    } catch (e) {
      done.current = false;
      setState({ error: (e as Error).message });
    }
  }

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopZxing: (() => void) | null = null;
    let raf = 0;
    let cancelled = false;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setState('unsupported');
      try {
        const BD = (window as unknown as { BarcodeDetector?: new (o: object) => Detector })
          .BarcodeDetector;
        if (BD) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          if (cancelled || !video.current) return;
          video.current.srcObject = stream;
          await video.current.play();
          setState('scanning');
          const det = new BD({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
          const tick = async () => {
            if (cancelled || done.current || !video.current) return;
            try {
              const r = await det.detect(video.current);
              if (r[0]) return void resolve(r[0].rawValue);
            } catch {
              /* frame no listo */
            }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromConstraints(
            { video: { facingMode: 'environment' } },
            video.current!,
            (result) => result && resolve(result.getText()),
          );
          stopZxing = () => controls.stop();
          if (!cancelled) setState('scanning');
        }
      } catch (e) {
        if (cancelled) return;
        const name = (e as DOMException).name;
        setState(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported');
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopZxing?.();
      stream?.getTracks().forEach((t) => t.stop());
    };
    // resolve es estable durante la vida de la página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void resolve(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink text-paper">
      <header className="pt-safe flex items-center justify-between px-4">
        <h1 className="num text-sm tracking-[0.12em]">ESCANEAR</h1>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => navigate(-1)}
          className="grid size-11 place-items-center"
        >
          <X size={22} />
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={video}
          className="absolute inset-0 size-full object-cover"
          playsInline
          muted
          aria-hidden
        />
        <div aria-hidden className="absolute inset-x-10 top-1/3 h-32">
          {[
            'top-0 left-0 border-t-2 border-l-2',
            'top-0 right-0 border-t-2 border-r-2',
            'bottom-0 left-0 border-b-2 border-l-2',
            'bottom-0 right-0 border-b-2 border-r-2',
          ].map((c) => (
            <span key={c} className={`absolute size-6 border-paper ${c}`} />
          ))}
        </div>
        <p role="status" className="absolute inset-x-4 bottom-6 text-center text-sm">
          {state === 'starting' && 'Abriendo la cámara…'}
          {state === 'scanning' && 'Apunta al código de barras.'}
          {state === 'looking' && 'Buscando el producto…'}
          {state === 'unsupported' && 'Este navegador no puede usar la cámara. Escribe el código.'}
          {typeof state === 'object' && <span className="text-alert">{state.error}</span>}
        </p>
        {state === 'denied' && (
          <div className="absolute inset-4 grid content-center gap-2 bg-ink text-sm">
            <p className="font-semibold">Sin permiso para la cámara.</p>
            <p>En iOS: Ajustes → Safari → Cámara → Permitir. Después vuelve a abrir el escáner.</p>
          </div>
        )}
      </div>

      <div className="pb-safe bg-paper px-4 pt-3 pb-4 text-ink">
        {manual ? (
          <form onSubmit={submit} className="grid grid-cols-[1fr_auto] items-end gap-2">
            <TextField
              label="Código de barras"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="submit" disabled={state === 'looking'}>
              Buscar
            </Button>
          </form>
        ) : (
          <Button variant="ghost" className="w-full" onClick={() => setManual(true)}>
            Escribir código
          </Button>
        )}
      </div>
    </div>
  );
}

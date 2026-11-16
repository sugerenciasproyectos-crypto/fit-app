import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { fmtQty, parseDecimal } from '../../lib/format';
import { Button, SectionTitle } from '../../ui/primitives';
import { useToast } from '../../ui/useToast';
import { useUserId } from '../auth/useAuth';
import {
  saveProductSupermarkets,
  supermarketsKey,
  useProductSupermarkets,
  useSupermarkets,
  type ProductSupermarket,
  type Supermarket,
} from './api';

/** Supermercados del producto con su precio (S7). */
export function ProductSupermarkets({
  productId,
  suggested,
}: {
  productId: string;
  suggested: string[];
}) {
  const all = useSupermarkets();
  const links = useProductSupermarkets(productId);
  if (!all.data || !links.data) return null;
  return <Editor productId={productId} all={all.data} links={links.data} suggested={suggested} />;
}

function Editor({
  productId,
  all,
  links,
  suggested,
}: {
  productId: string;
  all: Supermarket[];
  links: ProductSupermarket[];
  suggested: string[];
}) {
  const userId = useUserId();
  const qc = useQueryClient();
  const toast = useToast();
  const [state, setState] = useState<Record<string, { on: boolean; price: string }>>(() =>
    Object.fromEntries(
      all.map((s) => {
        const l = links.find((x) => x.supermarket_id === s.id);
        return [s.id, { on: !!l, price: l?.price_eur == null ? '' : fmtQty(l.price_eur) }];
      }),
    ),
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await saveProductSupermarkets(
        userId,
        productId,
        Object.entries(state)
          .filter(([, v]) => v.on)
          .map(([id, v]) => ({
            supermarket_id: id,
            price: v.price.trim() ? parseDecimal(v.price) : null,
          })),
      );
      await qc.invalidateQueries({ queryKey: supermarketsKey });
      toast({ message: 'Supermercados guardados' });
    } catch (e) {
      toast({ message: `No se guardó: ${(e as Error).message}`, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-2" aria-labelledby="sm">
      <SectionTitle id="sm">Supermercados y precio</SectionTitle>
      {suggested.length > 0 && (
        <p className="text-xs text-ink-2">Open Food Facts sugiere: {suggested.join(', ')}</p>
      )}
      {all.length === 0 ? (
        <p className="text-sm text-ink-2">
          Aún no hay supermercados.{' '}
          <Link to="/supermercados" className="text-action underline">
            Crear
          </Link>
        </p>
      ) : (
        <ul className="grid gap-1">
          {all.map((s) => {
            const v = state[s.id]!;
            return (
              <li key={s.id} className="grid grid-cols-[1fr_7rem] items-center gap-2">
                <label className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-5 accent-[var(--action)]"
                    checked={v.on}
                    onChange={(e) => setState({ ...state, [s.id]: { ...v, on: e.target.checked } })}
                  />
                  {s.name}
                </label>
                <label className="flex items-center gap-1">
                  <span className="sr-only">Precio en {s.name}</span>
                  <input
                    inputMode="decimal"
                    placeholder="—"
                    disabled={!v.on}
                    value={v.price}
                    onChange={(e) =>
                      setState({ ...state, [s.id]: { ...v, price: e.target.value } })
                    }
                    className="num min-h-11 w-full rounded border border-rule bg-paper px-2 text-right disabled:opacity-40"
                  />
                  <span className="text-sm text-ink-2">€</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      {all.length > 0 && (
        <Button variant="ghost" onClick={save} disabled={busy}>
          Guardar supermercados
        </Button>
      )}
    </section>
  );
}

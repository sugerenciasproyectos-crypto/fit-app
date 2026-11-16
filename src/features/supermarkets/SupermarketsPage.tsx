import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Button, TextField } from '../../ui/primitives';
import { useToast } from '../../ui/useToast';
import { useUserId } from '../auth/useAuth';
import {
  createSupermarket,
  deleteSupermarket,
  renameSupermarket,
  supermarketsKey,
  useSupermarkets,
} from './api';

/** D6 Supermercados. */
export default function SupermarketsPage() {
  const userId = useUserId();
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useSupermarkets();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: supermarketsKey });

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createSupermarket(userId, name);
      setName('');
      setError(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="grid gap-5 py-4">
      <header className="flex items-baseline justify-between">
        <h1 className="num text-2xl">Supermercados</h1>
        <Link to="/productos" className="text-action underline">
          Productos
        </Link>
      </header>
      <form onSubmit={add} className="grid grid-cols-[1fr_auto] items-end gap-2">
        <TextField
          label="Nuevo supermercado"
          value={name}
          error={error ?? undefined}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={!name.trim()}>
          Añadir
        </Button>
      </form>
      {isLoading ? (
        <p className="text-ink-2">Cargando…</p>
      ) : data?.length ? (
        <ul className="divide-y divide-dashed divide-rule">
          {data.map((s) => (
            <li key={s.id} className="flex min-h-12 items-center gap-2">
              <input
                aria-label={`Nombre de ${s.name}`}
                defaultValue={s.name}
                className="min-h-11 flex-1 bg-transparent"
                onBlur={async (e) => {
                  const v = e.target.value.trim();
                  if (!v || v === s.name) return;
                  try {
                    await renameSupermarket(s.id, v);
                    await refresh();
                  } catch (err) {
                    e.target.value = s.name;
                    toast({ message: (err as Error).message, error: true });
                  }
                }}
              />
              <button
                type="button"
                aria-label={`Eliminar ${s.name}`}
                className="grid size-11 place-items-center text-ink-2"
                onClick={async () => {
                  if (!window.confirm(`¿Eliminar ${s.name}? Se quitará de todos los productos.`))
                    return;
                  await deleteSupermarket(s.id);
                  await refresh();
                }}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-2">Aún no hay supermercados.</p>
      )}
    </div>
  );
}

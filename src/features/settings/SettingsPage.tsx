import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Button, SectionTitle } from '../../ui/primitives';

const LINKS = [{ to: '/ajustes/perfil', label: 'Perfil y objetivo' }] as const;

export default function SettingsPage() {
  const qc = useQueryClient();
  return (
    <div className="grid gap-6 py-4">
      <h1 className="num text-2xl">Ajustes</h1>
      <nav aria-label="Ajustes">
        <ul className="divide-y divide-dashed divide-rule border-y border-dashed border-rule">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="flex min-h-12 items-center justify-between">
                {l.label}
                <ChevronRight size={18} strokeWidth={1.5} aria-hidden className="text-ink-2" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <section className="mt-8 grid gap-2">
        <SectionTitle>Cuenta</SectionTitle>
        <Button
          variant="danger"
          onClick={async () => {
            await supabase.auth.signOut();
            qc.clear();
          }}
        >
          Cerrar sesión
        </Button>
      </section>
    </div>
  );
}

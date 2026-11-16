import { ChartLine, House, Package, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { useUserId } from '../features/auth/useAuth';
import { useProfile } from '../features/profile/api';
import { useWeeklyEvaluation } from '../features/tdee/api';
import { SyncReturnToast } from '../features/health/SyncReturnToast';

const TABS = [
  { to: '/', label: 'Hoy', icon: House, end: true },
  { to: '/progreso', label: 'Progreso', icon: ChartLine, end: false },
  { to: '/productos', label: 'Productos', icon: Package, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: Settings, end: false },
] as const;

export default function AppShell() {
  const userId = useUserId();
  const profile = useProfile();
  useWeeklyEvaluation(userId, profile.data);
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col">
      <div className="pt-safe flex-1 px-4 pb-24">
        <SyncReturnToast />
        <Outlet />
      </div>
      <nav
        aria-label="Secciones"
        className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper"
      >
        <ul className="mx-auto grid max-w-[480px] grid-cols-4">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                    isActive ? 'text-ink underline underline-offset-4' : 'text-ink-2'
                  }`
                }
              >
                <Icon size={22} strokeWidth={1.5} aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

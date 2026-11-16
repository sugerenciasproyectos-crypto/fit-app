import { Navigate, Outlet, useLocation } from 'react-router';
import { useProfile } from '../profile/api';
import { useAuth } from './useAuth';

function Loading() {
  return (
    <div className="mx-auto grid max-w-[480px] gap-3 p-4" aria-busy="true" aria-label="Cargando">
      {[60, 80, 40].map((w) => (
        <div key={w} className="h-4 rounded bg-paper-2" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

/** Sin sesión → P0 Login. */
export function RequireAuth() {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}

/** Sin perfil → onboarding. */
export function RequireProfile() {
  const { data, isLoading, error } = useProfile();
  if (isLoading) return <Loading />;
  if (error) {
    return (
      <p role="alert" className="p-4 text-alert">
        No se pudo cargar el perfil: {error.message}
      </p>
    );
  }
  if (!data) return <Navigate to="/bienvenida" replace />;
  return <Outlet />;
}

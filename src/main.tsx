import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router';
import './index.css';
import { AuthProvider } from './features/auth/auth';
import { RequireAuth, RequireProfile } from './features/auth/guards';
import LoginPage from './features/auth/LoginPage';
import TodayPage from './features/diary/TodayPage';
import { ToastProvider } from './ui/toast';
import AppShell from './ui/AppShell';

// Enlaces de invitación o recuperación (llegan a la raíz con #...type=invite|recovery).
if (
  /type=(invite|recovery)/.test(window.location.hash) &&
  window.location.pathname !== '/nueva-contrasena'
) {
  window.history.replaceState(null, '', `/nueva-contrasena${window.location.hash}`);
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } },
});

/** Ruta con carga diferida: Hoy y el login van en el bundle inicial; el resto, bajo demanda. */
const lazy = (
  load: () => Promise<{ default: React.ComponentType }>,
): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await load()).default }),
});

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/nueva-contrasena', ...lazy(() => import('./features/auth/SetPasswordPage')) },
  { path: '/dev/tokens', ...lazy(() => import('./features/dev/TokensPage')) },
  {
    element: <RequireAuth />,
    children: [
      { path: '/bienvenida', ...lazy(() => import('./features/onboarding/Onboarding')) },
      {
        element: <RequireProfile />,
        children: [
          { path: '/escanear', ...lazy(() => import('./features/scanner/ScannerPage')) },
          {
            element: <AppShell />,
            children: [
              { index: true, element: <TodayPage /> },
              { path: 'progreso', ...lazy(() => import('./features/progress/ProgressPage')) },
              { path: 'productos', ...lazy(() => import('./features/products/ProductsHub')) },
              {
                path: 'productos/comidas/:id',
                ...lazy(() => import('./features/meals/SavedMealPage')),
              },
              {
                path: 'productos/recetas/:id',
                ...lazy(() => import('./features/recipes/RecipePage')),
              },
              { path: 'productos/:id', ...lazy(() => import('./features/products/ProductPage')) },
              { path: 'importar', ...lazy(() => import('./features/import/ImportPage')) },
              {
                path: 'supermercados',
                ...lazy(() => import('./features/supermarkets/SupermarketsPage')),
              },
              { path: 'ajustes', ...lazy(() => import('./features/settings/SettingsPage')) },
              { path: 'ajustes/perfil', ...lazy(() => import('./features/profile/ProfileEdit')) },
              { path: 'ajustes/acerca', ...lazy(() => import('./features/settings/AboutPage')) },
              { path: 'ajustes/salud', ...lazy(() => import('./features/health/HealthPage')) },
              { path: 'ajustes/copia', ...lazy(() => import('./features/backup/BackupPage')) },
            ],
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);

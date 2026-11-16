import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import { AuthProvider } from './features/auth/auth';
import { RequireAuth, RequireProfile } from './features/auth/guards';
import LoginPage from './features/auth/LoginPage';
import TokensPage from './features/dev/TokensPage';
import Onboarding from './features/onboarding/Onboarding';
import ProfileEdit from './features/profile/ProfileEdit';
import SettingsPage from './features/settings/SettingsPage';
import AppShell from './ui/AppShell';
import Placeholder from './ui/Placeholder';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } },
});

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/dev/tokens', element: <TokensPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/bienvenida', element: <Onboarding /> },
      {
        element: <RequireProfile />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Placeholder title="Hoy" /> },
              { path: 'progreso', element: <Placeholder title="Progreso" /> },
              { path: 'productos', element: <Placeholder title="Productos" /> },
              { path: 'ajustes', element: <SettingsPage /> },
              { path: 'ajustes/perfil', element: <ProfileEdit /> },
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
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);

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
import ProductPage from './features/products/ProductPage';
import ProductsHub from './features/products/ProductsHub';
import SavedMealPage from './features/meals/SavedMealPage';
import ProfileEdit from './features/profile/ProfileEdit';
import ScannerPage from './features/scanner/ScannerPage';
import AboutPage from './features/settings/AboutPage';
import SettingsPage from './features/settings/SettingsPage';
import ProgressPage from './features/progress/ProgressPage';
import TodayPage from './features/diary/TodayPage';
import { ToastProvider } from './ui/toast';
import AppShell from './ui/AppShell';

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
          { path: '/escanear', element: <ScannerPage /> },
          {
            element: <AppShell />,
            children: [
              { index: true, element: <TodayPage /> },
              { path: 'progreso', element: <ProgressPage /> },
              { path: 'productos', element: <ProductsHub /> },
              { path: 'productos/comidas/:id', element: <SavedMealPage /> },
              { path: 'productos/:id', element: <ProductPage /> },
              { path: 'ajustes', element: <SettingsPage /> },
              { path: 'ajustes/perfil', element: <ProfileEdit /> },
              { path: 'ajustes/acerca', element: <AboutPage /> },
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

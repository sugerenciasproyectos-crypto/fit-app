import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import App from './App.tsx';
import TokensPage from './features/dev/TokensPage.tsx';

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/dev/tokens', element: <TokensPage /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

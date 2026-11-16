/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        name: 'Calorías',
        short_name: 'Calorías',
        description: 'Registro personal de calorías con objetivo adaptativo.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fbfaf6',
        theme_color: '#fbfaf6',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell en caché; los datos de Supabase siempre van por red.
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'packages/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
    coverage: {
      include: ['src/domain/**/*.ts', 'packages/schemas/src/**/*.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});

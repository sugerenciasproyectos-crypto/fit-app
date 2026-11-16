/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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

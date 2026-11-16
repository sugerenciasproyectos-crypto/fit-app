import { defineConfig } from 'vitest/config';

/** Tests de base de datos contra calorias-dev (RLS, RPC, triggers). */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/db/**/*.test.ts'],
    testTimeout: 20_000,
    fileParallelism: false,
  },
});

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@services': resolve(__dirname, './services'),
      '@packages': resolve(__dirname, './packages'),
    },
  },
});
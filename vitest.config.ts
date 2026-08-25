import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: [
        './tsconfig.json',
        './apps/web/tsconfig.json',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // 不受 shell 的 NODE_ENV 影響（這台機器有全域 NODE_ENV=development）
    env: { NODE_ENV: 'test' },
    include: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    setupFiles: ['./vitest.setup.ts'],
    mockReset: true,
    restoreMocks: true,
    clearMocks: false,
  },
});
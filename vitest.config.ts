import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    // 每個檔案用自己最近的 tsconfig 解析 @/*，跟 Next build 一致
    // （apps/web 的 @/lib、@/services 不能被根目錄的 @/* 蓋掉）
    tsconfigPaths({
      projects: [
        './tsconfig.json',
        './apps/web/tsconfig.json',
      ],
    }),
  ],
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
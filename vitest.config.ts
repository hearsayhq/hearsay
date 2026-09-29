import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'packages/*/test/**/*.test.ts', 'servers/*/src/**/*.test.ts'],
    testTimeout: 20_000,
  },
});

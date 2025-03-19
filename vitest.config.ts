/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      projects: ['./tsconfig.test.json'],
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['__tests__/setup.ts'],
    include: ['__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/types/**',
        'public/**',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      }
    },
    deps: {
      inline: ['@testing-library/user-event'],
    },
    pool: 'forks',
    testTimeout: 10000,
    hookTimeout: 10000,
    maxConcurrency: 5,
    maxWorkers: 2,
    minWorkers: 1,
    teardownTimeout: 1000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
}) 
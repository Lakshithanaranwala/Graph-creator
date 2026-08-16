import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// Separate config for tests so Vitest's bundled Vite doesn't conflict
// with the main vite.config.ts plugin types.
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})

/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { playwright } from '@vitest/browser-playwright'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Same-origin API in development, mirroring the nginx proxy of the image.
    proxy: {
      '/api': process.env.API_UPSTREAM ?? 'http://localhost:8080',
    },
  },
  test: {
    silent: 'passed-only',
    unstubEnvs: true,
    // Unit tests always run against the synthetic data, whatever .env.local says.
    env: { VITE_LIVE_API: 'false' },
    browser: {
      enabled: true,
      // BROWSER_CHANNEL=msedge (or chrome) runs the suite in an installed browser.
      provider: playwright({
        launchOptions: { channel: process.env.BROWSER_CHANNEL },
      }),
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      // include: ['src/**/*.{js,jsx,ts,tsx}'], // Uncomment to expand the report to all src/**/* so untested modules appear as 0% coverage.
      exclude: [
        'src/components/ui/**',
        'src/assets/**',
        'src/tanstack-table.d.ts',
        'src/routeTree.gen.ts',
        'src/test-utils/**',
        'src/routes/**',
      ],
    },
  },
})

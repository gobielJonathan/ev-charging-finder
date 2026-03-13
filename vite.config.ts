import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      // Service worker only active in production; virtual module still available in dev
      devOptions: { enabled: false },
      ...(mode === 'production' && {
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            // Cache OpenStreetMap tiles for 7 days (offline map viewing)
            {
              urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'osm-tiles',
                expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Cache OpenChargeMap API for 5 minutes (offline fallback)
            {
              urlPattern: /^https:\/\/api\.openchargemap\.io\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'ocm-api',
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 60, maxAgeSeconds: 5 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          name: 'ChargeNow — EV Charging Finder',
          short_name: 'ChargeNow',
          description:
            'Find EV charging stations near you. View the map, check availability and get directions.',
          theme_color: '#00c896',
          background_color: '#0d0d1a',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          categories: ['navigation', 'utilities'],
          icons: [
            {
              src: 'pwa-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: 'pwa-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
      }),
    }),
  ],
  server: {
    ...(mode === 'development' && {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, './.cert/key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, './.cert/cert.pem')),
      },
    }),
    host: '0.0.0.0', // Makes it accessible over local network IP
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))

import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue(), vueDevTools()],
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

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    port: 1818,
    host: '0.0.0.0',
  },
  // `vite preview` serves the production build behind the Cloudflare tunnel.
  // Allow the proxied Host header (the tunnel forwards e.g. ticket.<domain>).
  // Served files are static — no dev-server surface — so allowing all hosts is safe here.
  preview: {
    port: 1818,
    host: '0.0.0.0',
    allowedHosts: true,
  },
})

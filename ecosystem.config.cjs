/**
 * PM2 Ecosystem — Hermes Bug Tracker (obx-ticket)
 *
 *   pm2 start ecosystem.config.cjs   # start backend + frontend
 *   pm2 logs / pm2 status / pm2 monit
 *
 * Process names are prefixed "ticket-" so they never clash with the
 * pos-* processes running on the same machine.
 */
const path = require('path')

const FRONTEND_DIR = __dirname                       // Vue + Vite root
const BACKEND_DIR  = path.join(__dirname, 'backend') // Express + Prisma

module.exports = {
  apps: [
    // ── Express backend (compiled to dist/server.js) ──────────────────
    {
      name: 'ticket-backend',
      cwd: BACKEND_DIR,
      script: 'dist/server.js',
      interpreter: 'node',
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: '400M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      env: { NODE_ENV: 'production' },
    },

    // ── Vue/Vite static preview server (serves dist/) ─────────────────
    {
      name: 'ticket-frontend',
      cwd: FRONTEND_DIR,
      script: 'npm',
      args: 'run preview',          // vite preview --port 1818 --host 0.0.0.0
      interpreter: 'none',
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: '300M',
      merge_logs: true,
    },
  ],
}

import './config/env'
import app from './app'
import { env } from './config/env'
import prisma from './lib/prisma'
import { startDailySummaryJob } from './modules/agent/daily-summary.job'

async function main() {
  await prisma.$connect()
  console.log('[DB] Connected to PostgreSQL')

  await startDailySummaryJob()

  app.listen(env.PORT, () => {
    console.log(`[Server] Running on http://localhost:${env.PORT}`)
    console.log(`[Server] API base: http://localhost:${env.PORT}/api`)
  })
}

main().catch((err) => {
  console.error('[Server] Startup failed:', err)
  process.exit(1)
})

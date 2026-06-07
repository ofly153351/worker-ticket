import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'

import projectRoutes from './modules/projects/project.routes'
import ticketRoutes from './modules/tickets/ticket.routes'
import summaryRoutes from './modules/summaries/summary.routes'
import configRoutes from './modules/config/config.routes'
import { errorMiddleware } from './middleware/error.middleware'

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/api/projects', projectRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/summaries', summaryRoutes)
app.use('/api/config', configRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'OK', data: { timestamp: new Date().toISOString() } })
})

app.use(errorMiddleware)

export default app

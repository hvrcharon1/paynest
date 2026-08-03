import express from 'express'
import cors from 'cors'
import { initPool, closePool } from './db.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import paymentMethodRoutes from './routes/paymentMethods.js'
import serviceRoutes from './routes/services.js'
import notificationRoutes from './routes/notifications.js'
import insightRoutes from './routes/insights.js'
import dashboardRoutes from './routes/dashboard.js'
import historyRoutes from './routes/history.js'

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

export const app = express()

app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/payment-methods', paymentMethodRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/insights', insightRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/history', historyRoutes)

app.use(errorHandler)

// Only start the HTTP server when run directly (local dev / standalone).
// When imported as a module (Vercel serverless), this block is skipped.
if (process.argv[1] && (
  process.argv[1].endsWith('index.ts') ||
  process.argv[1].endsWith('index.js')
)) {
  const PORT = parseInt(process.env.PORT || '3000', 10)

  async function start() {
    try {
      await initPool()

      app.listen(PORT, () => {
        console.log(`[Server] PayNest API running on http://localhost:${PORT}`)
        console.log(`[Server] CORS allowed: ${CORS_ORIGIN}`)
      })
    } catch (err) {
      console.error('[Fatal] Failed to start server:', err)
      process.exit(1)
    }
  }

  process.on('SIGTERM', async () => {
    console.log('[Server] Shutting down...')
    await closePool()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    console.log('[Server] Shutting down...')
    await closePool()
    process.exit(0)
  })

  start()
}

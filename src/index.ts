import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/database'
import leadsRouter from './routes/leads'
import quotesRouter from './routes/quotes'
import logsRouter from './routes/logs'

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL,
      /\.vercel\.app$/,
    ].filter(Boolean)
  : '*'

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-secret'],
}))
app.use(express.json({ limit: '1mb' }))

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'NeoTravel API',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  })
})

// Routes API
app.use('/api/leads',  leadsRouter)
app.use('/api/quotes', quotesRouter)
app.use('/api/logs',   logsRouter)

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Route introuvable' })
})

// Démarrage
async function start() {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`NeoTravel API démarrée sur http://localhost:${PORT}`)
      console.log(`Health : http://localhost:${PORT}/health`)
    })
  } catch (err) {
    console.error('Erreur démarrage :', err)
    process.exit(1)
  }
}

start()

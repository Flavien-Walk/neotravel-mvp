import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter   from './routes/auth'
import leadsRouter  from './routes/leads'
import quotesRouter from './routes/quotes'
import logsRouter   from './routes/logs'
import chatRouter   from './routes/chat'

const app  = express()
const PORT = process.env.PORT || 4000

const corsOrigin: cors.CorsOptions['origin'] =
  process.env.NODE_ENV === 'production'
    ? ([process.env.FRONTEND_URL, /\.vercel\.app$/].filter(Boolean) as (string | RegExp)[])
    : '*'

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'NeoTravel API',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    email_provider: process.env.EMAIL_PROVIDER || 'console',
    llm_provider: process.env.LLM_PROVIDER || 'anthropic',
  })
})

app.use('/api/auth',   authRouter)
app.use('/api/leads',  leadsRouter)
app.use('/api/quotes', quotesRouter)
app.use('/api/logs',   logsRouter)
app.use('/api/chat',   chatRouter)

app.use((_req, res) => {
  res.status(404).json({ message: 'Route introuvable' })
})

async function start() {
  app.listen(PORT, () => {
    console.log(`NeoTravel API v0.2.0 — http://localhost:${PORT}`)
    console.log(`Health : http://localhost:${PORT}/health`)
    console.log(`DB     : Supabase PostgreSQL`)
  })
}

start()

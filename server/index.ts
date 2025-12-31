import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import priceitRouter from './api/priceit'

config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

app.use('/api/priceit', priceitRouter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`🚀 PriceIt API server running on http://localhost:${PORT}`)
})


import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import menusRoutes from './routes/menus.js'
import ingredientsRoutes from './routes/ingredients.js'
import suppliersRoutes from './routes/suppliers.js'
import ordersRoutes from './routes/orders.js'
import purchaseOrdersRoutes from './routes/purchaseOrders.js'
import analyticsRoutes from './routes/analytics.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const OPENAI_KEY = process.env.OPENAI_API_KEY

// connect mongo
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant'
mongoose.connect(MONGO, { autoIndex: true }).then(() => {
  console.log('Connected to MongoDB')
}).catch((err) => console.error('Mongo connect error', err))

// Mount API routes
app.use('/api/menus', menusRoutes)
app.use('/api/ingredients', ingredientsRoutes)
app.use('/api/suppliers', suppliersRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/purchase-orders', purchaseOrdersRoutes)
app.use('/api/analytics', analyticsRoutes)

app.post('/api/suggest', async (req, res) => {
  const { name, model = 'gpt-4o-mini' } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Missing dish name' })

  if (!OPENAI_KEY) {
    return res.status(500).json({ error: 'Server not configured with OPENAI_API_KEY' })
  }

  try {
    const prompt = `Suggest a concise list of ingredients for the dish "${name}". Return only valid JSON with a single key \"ingredients\" whose value is an array of strings. Example: {"ingredients":["Paneer","Tomato"]}`

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 200,
      }),
    })

    if (!r.ok) {
      const txt = await r.text()
      console.error('OpenAI error', txt)
      return res.status(502).json({ error: 'Upstream AI error', detail: txt })
    }

    const data = await r.json()
    const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || ''
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return res.json({ ingredients: [] })
    try {
      const parsed = JSON.parse(m[0])
      return res.json({ ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [] })
    } catch (err) {
      console.error('Failed to parse JSON from model:', err)
      return res.json({ ingredients: [] })
    }
  } catch (err) {
    console.error('Suggest API error', err)
    return res.status(500).json({ error: 'Internal error' })
  }
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Server listening on ${port}`))

import { Router } from 'express'

const router = Router()

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'

const SYSTEM_PROMPT = `You are ChefBot, a friendly and knowledgeable culinary assistant for RecipeNest — a recipe sharing platform.

You can help users with:
- Recipe ideas and suggestions (breakfast, lunch, dinner, desserts, snacks, soups, salads, drinks)
- Cooking techniques, tips, and tricks
- Ingredient substitutions and alternatives
- Information about famous chefs and their cooking styles
- Nutritional information and dietary advice
- How to create and share recipes on RecipeNest
- Meal planning and preparation advice

Keep your answers concise, practical, and friendly. When suggesting recipes, include key ingredients and a brief method. If asked about something unrelated to food, cooking, or chefs, politely redirect the conversation back to culinary topics.`

// POST /api/chat
router.post('/', async (req, res, next) => {
  try {
    const { message, history = [] } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'message is required' } })
    }

    // Build messages array for Ollama
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ]

    // Stream from Ollama
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: true }),
    })

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text()
      console.error('[chat] Ollama error:', ollamaRes.status, text)
      return res.status(502).json({
        error: {
          code: 'OLLAMA_ERROR',
          message: `Ollama returned ${ollamaRes.status}. Make sure Ollama is running and the model "${OLLAMA_MODEL}" is pulled.`,
        },
      })
    }

    // Forward the stream to the client as SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = ollamaRes.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(l => l.trim())

      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          const token = json?.message?.content ?? ''
          if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`)
          if (json.done) res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
        } catch {
          // skip malformed lines
        }
      }
    }

    res.end()
  } catch (err) {
    // If headers already sent (streaming started), just end
    if (res.headersSent) return res.end()
    next(err)
  }
})

export default router

import express from 'express'
import { config } from 'dotenv'

// Load environment variables
config()

const router = express.Router()

export type PriceItMessage = { 
  role: "system" | "user" | "assistant"
  content: string 
}

const PRICEIT_SYSTEM_PROMPT = `The assistant is a kid friendly pricing coach named "PriceIt Buddy".

Audience is ages 9 to 14.

Use simple words, short sentences, and positive tone.

Features it must support:

Suggest product ideas and fun product names.

Help write short product descriptions and special features.

Help think about who the target customer is.

Give simple pricing suggestions when given basic costs and explain in kid friendly language.

Encourage the user and validate their ideas, never harsh.

At the end, when requested, generate:

A rating between 1.0 and 5.0 with one decimal place (for example 4.2).

About 10 short fake customer reviews with names like "Alex", "Jordan", "Sam".

A short paragraph of overall feedback on the product and price.

Never talk about real money or financial advice beyond this toy learning context.

Keep answers under about 5 sentences unless asked otherwise.`

export async function callPriceItAI(messages: PriceItMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in environment variables')
  }

  // Ensure system prompt is always first
  const messagesWithSystem = [
    { role: "system" as const, content: PRICEIT_SYSTEM_PROMPT },
    ...messages.filter(msg => msg.role !== "system")
  ]

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VITE_APP_URL || 'http://localhost:5173',
        'X-Title': 'PriceIt - Kid Friendly Pricing Coach'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // Using a cost-effective but capable model
        messages: messagesWithSystem,
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices?.[0]?.message?.content

    if (!assistantMessage) {
      throw new Error('No response content from AI')
    }

    return assistantMessage
  } catch (error) {
    console.error('Error calling PriceIt AI:', error)
    throw error
  }
}

// API endpoint
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body as { messages: PriceItMessage[] }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    const response = await callPriceItAI(messages)
    res.json({ content: response })
  } catch (error) {
    console.error('API error:', error)
    res.status(500).json({ 
      error: 'Sorry, I had trouble answering. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router


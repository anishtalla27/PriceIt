import express from 'express'
import { config } from 'dotenv'

// Load environment variables
config()

const router = express.Router()

export type PriceItMessage = { 
  role: "system" | "user" | "assistant"
  content: string 
}

export type PriceItAIMode = "chat" | "autofill" | "final"

/**
 * Model routing strategy:
 * - chat: Fast, responsive model for conversational interactions
 * - autofill: Strong reasoning model for inferring missing details
 * - final: Creative synthesis model for final summaries and reviews
 */
const getModelForMode = (mode: PriceItAIMode): string => {
  switch (mode) {
    case "chat":
      // Fast, cost-effective model for quick responses
      return "openai/gpt-4o-mini"
    case "autofill":
      // Strong reasoning model for accurate inference
      return "openai/gpt-4o"
    case "final":
      // Creative synthesis model for engaging final content
      return "anthropic/claude-3.5-sonnet"
    default:
      return "openai/gpt-4o-mini"
  }
}

/**
 * Core system prompt for PriceIt Buddy AI assistant.
 * Enforces kid-friendly tone, safety, and conservative inference.
 */
export const PRICEIT_SYSTEM_PROMPT = `You are a kid-friendly assistant named "PriceIt Buddy".

AUDIENCE: Ages 9-14. Use simple words, short sentences, and a positive, supportive tone.

CORE PRINCIPLES:
- Be supportive and encouraging, never judgmental
- Explain things clearly in simple language
- Never claim certainty when you're making guesses
- Prefer underestimating over exaggerating
- Never give real financial advice beyond this learning context

CAPABILITIES:
- Understand natural language product descriptions
- Infer missing details conservatively (with clear explanations)
- Propose placeholder values when information is missing
- Suggest product ideas and fun product names
- Help write short descriptions and special features
- Help identify target customers
- Give simple pricing suggestions with kid-friendly explanations
- Generate ratings (1.0-5.0), fake customer reviews, and feedback

IMPORTANT CONSTRAINTS:
- You PROPOSE changes, you do NOT directly control the app
- Always explain your reasoning when making suggestions
- If you're unsure, say so clearly
- Never overwrite user intent - only suggest improvements
- Keep responses concise (under 5 sentences unless asked for more)
- Do not use markdown bullet lists or asterisks. Use short paragraphs and simple lines.

Remember: You're helping kids learn about pricing in a fun, safe way!`

/**
 * Structured change proposal schema.
 * The AI uses this format when suggesting app state changes.
 * 
 * IMPORTANT: The AI PROPOSES changes - the app decides whether to apply them.
 * The AI does NOT directly control UI or state.
 * 
 * Example shape:
 * {
 *   "changes": [
 *     {
 *       "field": "productName",
 *       "value": "SuperLamp",
 *       "confidence": 0.95,
 *       "reason": "You said the product is called SuperLamp."
 *     }
 *   ],
 *   "summary": "I filled in a few guesses based on what you told me."
 * }
 */
export type PriceItChangeProposal = {
  changes: Array<{
    field: string
    value: string | number
    confidence: number // 0.0 to 1.0
    reason: string
  }>
  summary: string
}

/**
 * Explicit allowlist of AppState field paths that AI can modify.
 * These MUST match exactly the field names in AppState interface.
 * DO NOT use labels like "Product Name" - use "productName" exactly.
 */
export const AI_ALLOWED_FIELDS = [
  'productName',      // Product name (string)
  'description',      // Product description (string)
  'feature',          // Special feature (string)
  'targetCustomer',   // Target customer/persona (string)
  'materialCost',     // Material cost per product (number)
  'packagingCost',    // Packaging cost per product (number)
  'extraCost',        // Extra/fixed costs (number)
  'finalPrice',       // Final price (number)
  'suggestedPrice',   // AI-suggested price (number)
  'pricePosition',    // Price position: "budget" | "fair" | "premium" (string)
  'pricingExplanation', // Pricing explanation text (string)
  'quality',          // Quality level 1-5 (number)
  'uniqueness',       // Uniqueness level 1-5 (number)
  'effort'            // Effort level 1-5 (number)
] as const

/**
 * Main AI function with model routing based on mode.
 * 
 * @param mode - Determines which model to use (chat/autofill/final)
 * @param messages - Conversation messages (system prompt will be prepended)
 * @returns Assistant text response, or safe fallback on error
 */
export async function callPriceItAI(
  mode: PriceItAIMode,
  messages: PriceItMessage[]
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    // Return safe fallback instead of throwing
    return 'Sorry, I need to be configured first. Please check the server setup.'
  }

  // Select model based on mode
  const model = getModelForMode(mode)
  
  // Adjust temperature and max_tokens based on mode
  const temperature = mode === "final" ? 0.8 : mode === "autofill" ? 0.3 : 0.7
  const maxTokens = mode === "final" ? 800 : mode === "autofill" ? 600 : 500

  // Enhance system prompt for autofill mode
  let systemPrompt = PRICEIT_SYSTEM_PROMPT
  if (mode === "autofill") {
    systemPrompt += `

CRITICAL: You are in AUTOFILL mode. You MUST respond with ONLY valid JSON. No markdown, no code blocks, no extra text before or after the JSON.

REQUIRED JSON FORMAT (no other text allowed):
{
  "changes": [
    {
      "field": "productName",
      "value": "SuperLamp",
      "confidence": 0.95,
      "reason": "You said the product is called SuperLamp."
    }
  ],
  "summary": "I filled in a few guesses based on what you told me."
}

VALID FIELDS - USE ONLY THESE EXACT FIELD NAMES (case-sensitive):
You MUST use these exact field names. Do NOT use labels like "Product Name" or "product name". Use the machine field names exactly as shown.

EXACT ALLOWLIST (copy these exactly):
["productName", "description", "feature", "targetCustomer", "materialCost", "packagingCost", "extraCost", "finalPrice", "suggestedPrice", "pricePosition", "pricingExplanation", "quality", "uniqueness", "effort"]

FIELD DESCRIPTIONS (IMPORTANT - READ CAREFULLY):
- "productName" (string) - Product name
- "description" (string) - Product description
- "feature" (string) - Special feature
- "targetCustomer" (string) - Target customer/persona
- "materialCost" (number) - COST PER PRODUCT for materials. If user says "$5 for 10 products", calculate: 5 / 10 = 0.50. Set materialCost to 0.50.
- "packagingCost" (number) - COST PER PRODUCT for packaging. If user says "$1 for 10 products", calculate: 1 / 10 = 0.10. Set packagingCost to 0.10.
- "extraCost" (number) - COST PER PRODUCT for extra costs. Calculate per-product cost the same way.
- "finalPrice" (number) - Final selling price
- "suggestedPrice" (number) - AI-suggested price
- "pricePosition" (string) - Must be exactly "budget", "fair", or "premium"
- "pricingExplanation" (string) - Explanation of pricing
- "quality" (number) - Must be 1, 2, 3, 4, or 5
- "uniqueness" (number) - Must be 1, 2, 3, 4, or 5
- "effort" (number) - Must be 1, 2, 3, 4, or 5

COST CALCULATION EXAMPLES:
- User says: "add a material cost named boxes for $5 and it makes 10 products"
  → Calculate: 5 / 10 = 0.50
  → Set: {"field": "materialCost", "value": 0.50, "confidence": 0.95, "reason": "User said $5 for 10 products, so $0.50 per product."}

- User says: "packaging costs $1 for 10 products"
  → Calculate: 1 / 10 = 0.10
  → Set: {"field": "packagingCost", "value": 0.10, "confidence": 0.95, "reason": "User said $1 for 10 products, so $0.10 per product."}

CRITICAL RULES:
1. You must ONLY use the field paths listed in the allowlist above.
2. Do NOT use labels like "Product Name" or "Material Cost".
3. If a field is not listed in the allowlist, skip it - DO NOT include it.
4. Do NOT invent new field names or use variations (no "product_name", "ProductName", etc.).
5. confidence must be between 0.0 and 1.0
6. reason must be one short sentence
7. Only propose changes you're confident about (confidence >= 0.6)
8. Return ONLY the JSON object, nothing else.

Example of CORRECT format (will be accepted):
{
  "changes": [
    {"field": "productName", "value": "GlowBuddy", "confidence": 0.9, "reason": "User mentioned the product name."},
    {"field": "description", "value": "A fun glowing toy", "confidence": 0.8, "reason": "Based on user description."},
    {"field": "materialCost", "value": 5.50, "confidence": 0.7, "reason": "Estimated material cost."}
  ],
  "summary": "I filled in the product name, description, and material cost."
}

Example of INCORRECT format (will be REJECTED):
{
  "changes": [
    {"field": "Product Name", "value": "GlowBuddy", ...}  // WRONG - "Product Name" is not in allowlist
    {"field": "product_name", "value": "GlowBuddy", ...}   // WRONG - "product_name" is not in allowlist
    {"field": "materials", "value": 5.50, ...}             // WRONG - "materials" is not in allowlist, use "materialCost"
  ]
}`
  }

  // Ensure system prompt is always first
  const messagesWithSystem = [
    { role: "system" as const, content: systemPrompt },
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
        model,
        messages: messagesWithSystem,
        temperature,
        max_tokens: maxTokens,
        ...(mode === "autofill" ? { response_format: { type: "json_object" } } : {})
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenRouter API error:', response.status, errorData)
      // Return safe fallback instead of throwing
      return 'Sorry, I had trouble answering. Please try again in a moment.'
    }

    const data = await response.json()
    const assistantMessage = data.choices?.[0]?.message?.content

    if (!assistantMessage) {
      return 'Sorry, I got a response but it was empty. Please try again.'
    }

    // For autofill mode, validate JSON structure and field allowlist
    if (mode === "autofill") {
      try {
        // Remove any markdown code blocks if present
        let cleanedMessage = assistantMessage.trim()
        if (cleanedMessage.startsWith('```json')) {
          cleanedMessage = cleanedMessage.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanedMessage.startsWith('```')) {
          cleanedMessage = cleanedMessage.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        const parsed = JSON.parse(cleanedMessage)
        
        // Validate structure
        if (!parsed.changes || !Array.isArray(parsed.changes)) {
          return JSON.stringify({
            error: "Invalid response format",
            changes: [],
            summary: "I had trouble understanding. Please try again."
          })
        }
        
        // Field allowlist - must match AI_ALLOWED_FIELDS exactly
        const validFields = [...AI_ALLOWED_FIELDS]
        
        // Validate each change with detailed logging
        const validChanges = parsed.changes.filter((change: any) => {
          // Check field is in allowlist
          if (!change.field || !validFields.includes(change.field)) {
            console.warn(`[Autofill] SKIPPED field "${change.field}": Not in allowlist. Valid fields: ${validFields.join(', ')}`)
            return false
          }
          
          // Check value exists and type matches
          if (change.value === undefined || change.value === null) {
            console.warn(`[Autofill] SKIPPED field "${change.field}": Value is undefined or null`)
            return false
          }
          
          // Type validation based on field
          const numericFields = ['materialCost', 'packagingCost', 'extraCost', 'finalPrice', 'suggestedPrice', 'quality', 'uniqueness', 'effort']
          if (numericFields.includes(change.field) && typeof change.value !== 'number') {
            console.warn(`[Autofill] SKIPPED field "${change.field}": Requires number, got ${typeof change.value} (value: ${JSON.stringify(change.value)})`)
            return false
          }
          
          const stringFields = ['productName', 'description', 'feature', 'targetCustomer', 'pricePosition', 'pricingExplanation']
          if (stringFields.includes(change.field) && typeof change.value !== 'string') {
            console.warn(`[Autofill] SKIPPED field "${change.field}": Requires string, got ${typeof change.value} (value: ${JSON.stringify(change.value)})`)
            return false
          }
          
          // Validate confidence
          if (typeof change.confidence !== 'number' || change.confidence < 0 || change.confidence > 1) {
            console.warn(`[Autofill] SKIPPED field "${change.field}": Invalid confidence ${change.confidence} (must be 0.0-1.0)`)
            return false
          }
          
          // Validate reason
          if (typeof change.reason !== 'string' || !change.reason.trim()) {
            console.warn(`[Autofill] SKIPPED field "${change.field}": Missing or empty reason`)
            return false
          }
          
          // Log valid change
          console.log(`[Autofill] VALID change: ${change.field} = ${JSON.stringify(change.value)} (confidence: ${change.confidence})`)
          return true
        })
        
        // Log validation summary
        const totalChanges = parsed.changes.length
        const validCount = validChanges.length
        const invalidCount = totalChanges - validCount
        console.log(`[Autofill] Validation: ${validCount} valid, ${invalidCount} invalid out of ${totalChanges} total changes`)
        if (invalidCount > 0) {
          console.warn(`[Autofill] ${invalidCount} change(s) were filtered out. Check logs above for reasons.`)
        }
        
        return JSON.stringify({
          changes: validChanges,
          summary: parsed.summary || "I made some suggestions."
        })
      } catch (parseError) {
        console.error('Failed to parse autofill response:', parseError)
        return JSON.stringify({
          error: "Failed to parse response",
          changes: [],
          summary: "I had trouble processing that. Please try again."
        })
      }
    }

    return assistantMessage
  } catch (error) {
    // Never log API keys - only log error types
    console.error('Error calling PriceIt AI:', error instanceof Error ? error.message : 'Unknown error')
    // Return safe fallback instead of throwing
    return 'Sorry, I had trouble connecting. Please check your connection and try again.'
  }
}

/**
 * INTERNAL TEST HOOK (for developer verification only)
 * 
 * Example usage:
 * 
 * callPriceItAI("chat", [
 *   { role: "system", content: PRICEIT_SYSTEM_PROMPT },
 *   { role: "user", content: "I'm selling a lamp for kids called SuperLamp." }
 * ]).then(response => {
 *   console.log("AI Response:", response)
 * }).catch(error => {
 *   console.error("Test error:", error)
 * })
 */

// API endpoint - supports mode parameter for model routing
router.post('/chat', async (req, res) => {
  try {
    const { messages, mode } = req.body as { 
      messages: PriceItMessage[]
      mode?: PriceItAIMode
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    // Default to "chat" mode if not specified
    const aiMode: PriceItAIMode = mode || "chat"
    
    const response = await callPriceItAI(aiMode, messages)
    res.json({ content: response })
  } catch (error) {
    console.error('API error:', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({ 
      error: 'Sorry, I had trouble answering. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Pricing recommendation endpoint
router.post('/pricing', async (req, res) => {
  try {
    const {
      productName,
      targetCustomer,
      quality,
      uniqueness,
      effort,
      costBreakdown
    } = req.body as {
      productName: string
      targetCustomer: string
      quality: number
      uniqueness: number
      effort: number
      costBreakdown: {
        variablePerProduct: number
        fixedPerProduct: number
        totalCostPerProduct: number
        recommendedMarginPercent: number
      }
    }

    if (!costBreakdown || typeof costBreakdown.totalCostPerProduct !== 'number') {
      return res.status(400).json({ error: 'Cost breakdown is required' })
    }

    // Build AI prompt for pricing recommendation
    const valueScore = (quality || 2) + (uniqueness || 2) + (effort || 2)
    const valueLevel = valueScore <= 4 ? "Low" : valueScore <= 7 ? "Medium" : "High"
    
    const pricingPrompt = `I need a pricing recommendation for a product.

Product: ${productName || "Unnamed product"}
Target Customer: ${targetCustomer || "General"}
Value Level: ${valueLevel} (Quality: ${quality || 2}/3, Uniqueness: ${uniqueness || 2}/3, Effort: ${effort || 2}/3)

Cost Breakdown:
- Variable cost per product: $${costBreakdown.variablePerProduct.toFixed(2)}
- Fixed cost per product: $${costBreakdown.fixedPerProduct.toFixed(2)}
- Total cost per product: $${costBreakdown.totalCostPerProduct.toFixed(2)}

Please suggest:
1. A suggestedPrice (must be >= $${costBreakdown.totalCostPerProduct.toFixed(2)}, round to nearest 0.50)
2. A pricePosition: "budget", "fair", or "premium"
3. A pricingExplanation (one short paragraph, kid-friendly, explaining why this price fits)

Return ONLY valid JSON with this structure:
{
  "changes": [
    { "field": "suggestedPrice", "value": 18.50, "confidence": 0.8, "reason": "..." },
    { "field": "pricePosition", "value": "fair", "confidence": 0.75, "reason": "..." },
    { "field": "pricingExplanation", "value": "Short explanation...", "confidence": 0.7, "reason": "..." }
  ],
  "summary": "I suggested a price based on your costs and value."
}`

    const messages: PriceItMessage[] = [
      { role: "user", content: pricingPrompt }
    ]

    const response = await callPriceItAI("autofill", messages)
    
    // Parse and validate response
    try {
      const parsed = JSON.parse(response)
      if (parsed.changes && Array.isArray(parsed.changes)) {
        // Validate suggestedPrice is >= totalCostPerProduct
        const priceChange = parsed.changes.find((c: any) => c.field === "suggestedPrice")
        if (priceChange) {
          priceChange.value = Math.max(costBreakdown.totalCostPerProduct, Number(priceChange.value))
        }
        res.json(parsed)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (parseError) {
      console.error('Failed to parse pricing response:', parseError)
      res.status(500).json({
        error: "Failed to generate pricing recommendation",
        changes: [],
        summary: "Sorry, I had trouble calculating a price. Please try again."
      })
    }
  } catch (error) {
    console.error('Pricing API error:', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({
      error: 'Sorry, I had trouble calculating a price. Please try again.',
      changes: [],
      summary: "Sorry, I had trouble calculating a price. Please try again."
    })
  }
})

// Final output generation endpoint (rating, reviews, feedback)
router.post('/final', async (req, res) => {
  try {
    const {
      productName,
      description,
      targetCustomer,
      suggestedPrice,
      totalCostPerProduct,
      valueLevel,
      pricePosition
    } = req.body as {
      productName: string
      description: string
      targetCustomer: string
      suggestedPrice: number
      totalCostPerProduct: number
      valueLevel: "low" | "medium" | "high"
      pricePosition: "budget" | "fair" | "premium"
    }

    // Build AI prompt for final output
    const finalPrompt = `Generate a final review summary for a kid-friendly product pricing learning tool.

Product: ${productName || "Unnamed product"}
Description: ${description || "No description"}
Target Customer: ${targetCustomer || "General"}
Suggested Price: $${(suggestedPrice || 0).toFixed(2)}
Cost per Product: $${(totalCostPerProduct || 0).toFixed(2)}
Value Level: ${valueLevel || "medium"}
Price Position: ${pricePosition || "fair"}

Generate:
1. A rating out of 5 (0.0 to 5.0, one decimal place, e.g., 4.2)
2. Exactly 10 fake customer reviews, each with:
   - A simple first name (like "Alex", "Jordan", "Sam", "Casey", "Riley", "Morgan", "Taylor", "Jamie", "Quinn", "Avery")
   - A rating from 1 to 5 (whole number)
   - A review text (1-2 sentences, kid-friendly, positive or constructive)
3. A short overall feedback paragraph (2-3 sentences) covering:
   - What's great about the product
   - What could be improved
   - Encouragement for the creator
4. A one-sentence summary of the product

IMPORTANT RULES:
- All reviews are obviously fictional (for learning purposes)
- Keep language kid-friendly (ages 9-14)
- No adult themes or inappropriate content
- Reviews should be varied (some 5-star, some 4-star, some 3-star)
- Names should be simple and diverse

Return ONLY valid JSON with this structure:
{
  "rating": 4.2,
  "reviews": [
    { "name": "Alex", "rating": 5, "text": "I love this product! It's really fun to use." },
    { "name": "Jordan", "rating": 4, "text": "Pretty good, but could use more colors." },
    ...
  ],
  "feedback": "This is a great product idea! The concept is solid and the pricing makes sense. Consider adding more features to make it even better. Keep up the good work!",
  "summary": "A fun and creative product that kids will enjoy."
}`

    const messages: PriceItMessage[] = [
      { role: "user", content: finalPrompt }
    ]

    const response = await callPriceItAI("final", messages)
    
    // Parse and validate response
    try {
      const parsed = JSON.parse(response)
      
      // Validate rating
      let rating = Math.max(0, Math.min(5, Number(parsed.rating || 4.0)))
      rating = Math.round(rating * 10) / 10 // Round to 1 decimal
      
      // Validate reviews - ensure exactly 10
      let reviews = Array.isArray(parsed.reviews) ? parsed.reviews : []
      
      // Trim if too many
      if (reviews.length > 10) {
        reviews = reviews.slice(0, 10)
      }
      
      // Pad if too few with safe generic reviews
      const genericReviews = [
        { name: "Sam", rating: 4, text: "Pretty good product! I enjoyed using it." },
        { name: "Jordan", rating: 5, text: "I really liked it. Great job!" },
        { name: "Casey", rating: 3, text: "It's okay, could be better." },
        { name: "Riley", rating: 4, text: "Nice product, fun to use." },
        { name: "Morgan", rating: 5, text: "Awesome! I love it." }
      ]
      
      while (reviews.length < 10) {
        const generic = genericReviews[reviews.length % genericReviews.length]
        reviews.push({ ...generic })
      }
      
      // Validate each review
      reviews = reviews.map((review: any) => ({
        name: String(review.name || "Customer").substring(0, 20).trim() || "Customer",
        rating: Math.max(1, Math.min(5, Math.round(Number(review.rating || 4)))),
        text: String(review.text || "Good product!").substring(0, 200).trim() || "Good product!"
      }))
      
      // Validate feedback
      const feedback = String(parsed.feedback || "This is a great product idea! Keep working on it and you'll do great.").substring(0, 500).trim()
      
      // Validate summary
      const summary = String(parsed.summary || "").substring(0, 200).trim()
      
      res.json({
        rating,
        reviews,
        feedback,
        summary
      })
    } catch (parseError) {
      console.error('Failed to parse final output response:', parseError)
      // Return safe fallback
      res.json({
        rating: 4.0,
        reviews: [
          { name: "Alex", rating: 5, text: "Great product idea!" },
          { name: "Jordan", rating: 4, text: "I really like it." },
          { name: "Sam", rating: 4, text: "Pretty good!" },
          { name: "Casey", rating: 3, text: "It's okay." },
          { name: "Riley", rating: 5, text: "Awesome product!" },
          { name: "Morgan", rating: 4, text: "Nice work!" },
          { name: "Taylor", rating: 5, text: "I love it!" },
          { name: "Jamie", rating: 4, text: "Good job!" },
          { name: "Quinn", rating: 3, text: "Could be better." },
          { name: "Avery", rating: 4, text: "Pretty cool!" }
        ],
        feedback: "This is a great product idea! The concept is solid and shows creativity. Consider adding more features to make it even better. Keep up the good work!",
        summary: "A creative product idea with good potential."
      })
    }
  } catch (error) {
    console.error('Final output API error:', error instanceof Error ? error.message : 'Unknown error')
    // Return safe fallback on error
    res.json({
      rating: 4.0,
      reviews: [
        { name: "Alex", rating: 5, text: "Great product idea!" },
        { name: "Jordan", rating: 4, text: "I really like it." },
        { name: "Sam", rating: 4, text: "Pretty good!" },
        { name: "Casey", rating: 3, text: "It's okay." },
        { name: "Riley", rating: 5, text: "Awesome product!" },
        { name: "Morgan", rating: 4, text: "Nice work!" },
        { name: "Taylor", rating: 5, text: "I love it!" },
        { name: "Jamie", rating: 4, text: "Good job!" },
        { name: "Quinn", rating: 3, text: "Could be better." },
        { name: "Avery", rating: 4, text: "Pretty cool!" }
      ],
      feedback: "This is a great product idea! The concept is solid and shows creativity. Consider adding more features to make it even better. Keep up the good work!",
      summary: "A creative product idea with good potential."
    })
  }
})

export default router


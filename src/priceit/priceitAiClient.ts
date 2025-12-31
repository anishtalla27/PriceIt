export type PriceItMessage = { 
  role: "system" | "user" | "assistant"
  content: string 
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function callPriceItAI(messages: PriceItMessage[]): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/priceit/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const data = await response.json()
    return data.content || 'Sorry, I had trouble answering. Please try again.'
  } catch (error) {
    console.error('Error calling PriceIt AI:', error)
    return 'Sorry, I had trouble answering. Please try again.'
  }
}


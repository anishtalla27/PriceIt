import React, { useState, useRef, useEffect } from 'react'
import { callPriceItAI, PriceItMessage } from '../../priceit/priceitAiClient'
import { useAppState } from '../../context/AppState'

type ChatMessage = {
  role: "user" | "assistant"
  content: string
  isChangeProposal?: boolean
  changeData?: {
    changes: Array<{
      field: string
      value: string | number
      confidence: number
      reason: string
    }>
    summary: string
  }
}

// Field name labels for display
const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    productName: "Product Name",
    description: "Description",
    feature: "Special Feature",
    targetCustomer: "Target Customer",
    materialCost: "Material Cost",
    packagingCost: "Packaging Cost",
    extraCost: "Extra Cost",
    finalPrice: "Final Price",
    suggestedPrice: "Suggested Price",
    pricePosition: "Price Position",
    pricingExplanation: "Pricing Explanation",
    quality: "Quality",
    uniqueness: "Uniqueness",
    effort: "Effort"
  }
  return labels[field] || field
}

const truncateValue = (value: any, maxLength: number = 30): string => {
  const str = String(value)
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + "..."
}

export default function PriceItAIChat() {
  const { 
    applyAIChanges, 
    state, 
    undoLastAIBatch, 
    undoSpecificChange, 
    undoAllAIChanges 
  } = useAppState()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "changes">("chat")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<{
    changes: Array<{
      field: string
      value: string | number
      confidence: number
      reason: string
    }>
    summary: string
    allowOverwrite?: boolean
  } | null>(null)
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Detect if user wants autofill
  const isAutofillRequest = (text: string): boolean => {
    const lower = text.toLowerCase().trim()
    
    // Direct autofill keywords
    const autofillKeywords = [
      'fill it in',
      'fill it in for me',
      'autofill',
      'apply that',
      'use those',
      'set these values',
      'put that into the form',
      'update the fields',
      'fill in',
      'help me fill',
      'fill out',
      'complete',
      'fill the form',
      'fill this',
      'suggest',
      'replace everything',
      'overwrite',
      'update all'
    ]
    
    // Check for direct autofill intent
    if (autofillKeywords.some(keyword => lower.includes(keyword))) {
      return true
    }
    
    // Check for confirmation responses after suggestions
    const confirmationKeywords = ['yes', 'do it', 'go ahead', 'sure', 'ok', 'okay', 'yep', 'yeah', 'apply', 'use that']
    const isConfirmation = confirmationKeywords.some(keyword => {
      // Match whole word or at start/end of string
      const regex = new RegExp(`(^|\\s)${keyword}(\\s|$|[.,!?])`, 'i')
      return regex.test(lower)
    })
    
    if (isConfirmation && messages.length > 0) {
      // Check if last assistant message suggested values or changes
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant') {
        const lastContent = lastMessage.content.toLowerCase()
        const hasSuggestions = lastContent.includes('suggest') || 
                              lastContent.includes('recommend') ||
                              lastContent.includes('change') ||
                              lastContent.includes('update') ||
                              lastContent.includes('fill') ||
                              lastMessage.isChangeProposal ||
                              (lastMessage.changeData && lastMessage.changeData.changes.length > 0)
        
        if (hasSuggestions) {
          return true
        }
      }
    }
    
    // Check for imperative commands with field keywords
    // Examples: "add a material cost...", "set the product name...", "update the description..."
    const imperativeVerbs = ['add', 'set', 'update', 'change', 'replace', 'remove', 'put', 'make', 'create', 'enter']
    const fieldKeywords = [
      'material', 'materials', 'packaging', 'extra cost', 'extra costs',
      'cost', 'costs', 'price', 'prices', 'name', 'description', 'target',
      'customer', 'feature', 'quality', 'uniqueness', 'effort', 'product name',
      'target customer', 'special feature', 'product', 'item'
    ]
    
    const hasImperativeVerb = imperativeVerbs.some(verb => {
      // Check if verb appears at start of message or after whitespace/punctuation
      // Match patterns like: "add ", "add a", "add the", "set ", "set the", etc.
      const regex = new RegExp(`(^|\\s)${verb}(\\s|$)`, 'i')
      return regex.test(lower)
    })
    
    const hasFieldKeyword = fieldKeywords.some(keyword => lower.includes(keyword))
    
    if (hasImperativeVerb && hasFieldKeyword) {
      return true
    }
    
    return false
  }

  const shouldAllowOverwrite = (text: string): boolean => {
    const lower = text.toLowerCase()
    return lower.includes('replace') || lower.includes('overwrite') || lower.includes('update all')
  }

  // Normalize AI messages to remove markdown formatting
  const normalizeAIMessage = (content: string): string => {
    let normalized = content
    // Remove markdown bullets and asterisks at start of lines
    normalized = normalized.replace(/^[\s]*[-*•]\s+/gm, '')
    // Remove markdown bold/italic markers
    normalized = normalized.replace(/\*\*([^*]+)\*\*/g, '$1')
    normalized = normalized.replace(/\*([^*]+)\*/g, '$1')
    // Clean up multiple line breaks
    normalized = normalized.replace(/\n{3,}/g, '\n\n')
    // Trim each line
    normalized = normalized.split('\n').map(line => line.trim()).join('\n')
    return normalized.trim()
  }

  // Detect if AI response contains suggested values
  const hasSuggestedValues = (content: string): boolean => {
    const lower = content.toLowerCase()
    const suggestionKeywords = [
      'suggest', 'recommend', 'try', 'could be', 'might be',
      'how about', 'what about', 'consider', 'you could'
    ]
    return suggestionKeywords.some(keyword => lower.includes(keyword))
  }

  // Check if user initially asked for help filling things in
  const userAskedForHelp = (): boolean => {
    // Check last few user messages for help requests
    const recentUserMessages = messages
      .filter(msg => msg.role === 'user')
      .slice(-3)
      .map(msg => msg.content.toLowerCase())
    
    const helpKeywords = [
      'help', 'fill', 'complete', 'suggest', 'recommend',
      'what should', 'what can', 'how do', 'tell me'
    ]
    
    return recentUserMessages.some(msg => 
      helpKeywords.some(keyword => msg.includes(keyword))
    )
  }

  const handleSend = async () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || isLoading) return

    // Add user message
    const userMessage: ChatMessage = { role: "user", content: trimmedInput }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Build conversation history with current state context
      const stateContext = `Current product info:
- Product Name: ${state.productName.value || '(empty)'}
- Description: ${state.description.value || '(empty)'}
- Feature: ${state.feature.value || '(empty)'}
- Target Customer: ${state.targetCustomer.value || '(empty)'}
- Material Cost: $${state.materialCost.value}
- Packaging Cost: $${state.packagingCost.value}
- Extra Cost: $${state.extraCost.value}`

      // Keep last ~12 messages for context (limit conversation history)
      const recentMessages = messages.slice(-12)
      const conversationHistory: PriceItMessage[] = [
        ...recentMessages.map(msg => ({ role: msg.role, content: msg.content })),
        { role: "user" as const, content: `${stateContext}\n\nUser: ${trimmedInput}` }
      ]

      // Determine mode based on intent detection
      const isAutofill = isAutofillRequest(trimmedInput)
      const allowOverwrite = shouldAllowOverwrite(trimmedInput)
      const mode = isAutofill ? "autofill" : "chat"

      // Debug logging
      console.log(`[PriceIt AI] Intent detected: ${isAutofill ? 'AUTOFILL_REQUEST' : 'CHAT'}`, {
        userMessage: trimmedInput,
        mode,
        allowOverwrite
      })

      // Call AI with appropriate mode
      const response = await callPriceItAI(conversationHistory, mode)

      if (isAutofill) {
        // Parse JSON response
        try {
          const changeData = JSON.parse(response)
          
          if (changeData.error) {
            const errorMessage: ChatMessage = {
              role: "assistant",
              content: changeData.summary || "Sorry, I had trouble with that. Please try again."
            }
            setMessages(prev => [...prev, errorMessage])
          } else if (changeData.changes && changeData.changes.length > 0) {
            // Always apply changes when autofill is requested and response is valid
            const result = applyAIChanges(changeData.changes, allowOverwrite)
            
            // Show clean, simple response
            const appliedMessage: ChatMessage = {
              role: "assistant",
              content: result.applied > 0 
                ? "Done. I filled in the fields on the page. You can change anything."
                : "I couldn't update any fields. They may have already been filled in."
            }
            setMessages(prev => [...prev, appliedMessage])
            
            // Log for debugging
            console.log(`[PriceIt AI] Applied ${result.applied} changes, skipped ${result.skipped}`)
          } else {
            const noChangesMessage: ChatMessage = {
              role: "assistant",
              content: "I couldn't find anything to fill in. Can you tell me more about your product?"
            }
            setMessages(prev => [...prev, noChangesMessage])
          }
        } catch (parseError) {
          console.error('Failed to parse autofill response:', parseError)
          const errorMessage: ChatMessage = {
            role: "assistant",
            content: "Sorry, I had trouble processing that. Please try again."
          }
          setMessages(prev => [...prev, errorMessage])
        }
      } else {
        // Regular chat response - normalize formatting
        let normalizedResponse = normalizeAIMessage(response)
        
        // Proactively offer to apply if AI suggested values and user asked for help
        if (hasSuggestedValues(normalizedResponse) && userAskedForHelp()) {
          normalizedResponse += "\n\nWant me to apply these to the form?"
        }
        
        const aiMessage: ChatMessage = { role: "assistant", content: normalizedResponse }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I had trouble answering. Please try again in a moment."
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyChanges = () => {
    if (!pendingChanges) return

    const result = applyAIChanges(pendingChanges.changes, pendingChanges.allowOverwrite || false)
    const appliedMessage: ChatMessage = {
      role: "assistant",
      content: `Done! I updated ${result.applied} field(s). ${result.skipped > 0 ? `${result.skipped} field(s) were skipped because you already edited them.` : ''} You can change anything if needed!`
    }
    setMessages(prev => [...prev, appliedMessage])
    setPendingChanges(null)
  }

  const handleRejectChanges = () => {
    setPendingChanges(null)
    const rejectedMessage: ChatMessage = {
      role: "assistant",
      content: "No problem! I won't make those changes. If you want, I can help fill things in differently."
    }
    setMessages(prev => [...prev, rejectedMessage])
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[1001] bg-purple-500 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-label="Toggle AI Helper"
      >
        AI Helper
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 md:w-96 bg-white shadow-2xl z-[1001] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold">PriceIt Buddy</h3>
              <p className="text-sm text-purple-100">I can help you anytime</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-purple-200 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-700"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === "chat"
                  ? "bg-white text-purple-600"
                  : "bg-purple-400 text-white hover:bg-purple-300"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("changes")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === "changes"
                  ? "bg-white text-purple-600"
                  : "bg-purple-400 text-white hover:bg-purple-300"
              }`}
            >
              Changes
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {activeTab === "chat" ? (
            <>
              {messages.length === 0 && (
                <div className="text-center text-gray-500 text-sm mt-8">
                  <p>Hi! I'm PriceIt Buddy. 👋</p>
                  <p className="mt-2">Ask me anything about your product or pricing!</p>
                </div>
              )}

              {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              <div
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-800 border border-purple-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.role === 'assistant' ? normalizeAIMessage(message.content) : message.content}</p>
                </div>
              </div>
              {message.isChangeProposal && message.changeData && (
                <div className="flex justify-start gap-2 px-2">
                  <button
                    onClick={handleApplyChanges}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-600 transition-colors"
                  >
                    Apply Changes
                  </button>
                  <button
                    onClick={handleRejectChanges}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-600 border border-purple-100 rounded-2xl px-4 py-2">
                <p className="text-sm">PriceIt Buddy is thinking…</p>
              </div>
            </div>
          )}

              <div ref={messagesEndRef} />
            </>
          ) : (
            /* Changes Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-purple-700">AI Changes</h4>
                {state.undoStack.length > 0 && (
                  <button
                    onClick={() => {
                      const result = undoAllAIChanges()
                      if (result.reverted > 0 || result.skipped > 0) {
                        // Show feedback
                      }
                    }}
                    className="text-sm text-purple-600 hover:text-purple-800 font-semibold"
                  >
                    Undo All
                  </button>
                )}
              </div>

              {state.undoStack.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  <p>No AI changes yet.</p>
                  <p className="mt-2">AI changes will appear here when I help fill in fields.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.undoStack.map((batch, batchIndex) => {
                    const isExpanded = expandedBatches.has(batchIndex)
                    const aiChanges = batch.filter(c => c.appliedBy === "ai")
                    const timeStr = new Date(aiChanges[0]?.timestamp || Date.now()).toLocaleTimeString()

                    return (
                      <div key={batchIndex} className="bg-white rounded-lg border border-purple-100 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-purple-700">
                              AI updated {aiChanges.length} field{aiChanges.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-500">{timeStr}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedBatches)
                                if (isExpanded) {
                                  newExpanded.delete(batchIndex)
                                } else {
                                  newExpanded.add(batchIndex)
                                }
                                setExpandedBatches(newExpanded)
                              }}
                              className="text-xs text-purple-600 hover:text-purple-800"
                            >
                              {isExpanded ? "Hide" : "Show"}
                            </button>
                            {batchIndex === state.undoStack.length - 1 && (
                              <button
                                onClick={() => {
                                  const result = undoLastAIBatch()
                                  if (result.skipped > 0) {
                                    // Could show a message about skipped fields
                                  }
                                }}
                                className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
                              >
                                Undo
                              </button>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 border-t border-purple-100 pt-3">
                            {aiChanges.map((change) => {
                              const isTouched = state.fieldTouchedByUser[change.field]
                              return (
                                <div key={change.changeId} className="text-sm">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-700">
                                        {getFieldLabel(change.field)}
                                      </p>
                                      <p className="text-gray-600 text-xs">
                                        {truncateValue(change.prevValue)} → {truncateValue(change.nextValue)}
                                      </p>
                                      {change.reason && (
                                        <p className="text-gray-500 text-xs mt-1 italic">
                                          {change.reason}
                                        </p>
                                      )}
                                      {change.confidence !== undefined && (
                                        <p className="text-gray-500 text-xs">
                                          Confidence: {Math.round(change.confidence * 100)}%
                                        </p>
                                      )}
                                      {isTouched && (
                                        <p className="text-purple-600 text-xs mt-1 italic">
                                          This field was edited by you, so I didn't undo it.
                                        </p>
                                      )}
                                    </div>
                                    {!isTouched && (
                                      <button
                                        onClick={() => {
                                          const result = undoSpecificChange(change.changeId)
                                          if (result.skipped) {
                                            // Could show message
                                          }
                                        }}
                                        className="text-xs text-purple-600 hover:text-purple-800 ml-2"
                                      >
                                        Undo
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-purple-300 rounded-full focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="bg-purple-500 text-white px-6 py-2 rounded-full font-semibold transition-all duration-150 hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  )
}


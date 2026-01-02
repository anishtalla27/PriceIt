import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type FieldMetadata = {
  lastUpdatedBy: "user" | "ai"
  aiConfidence?: number
  aiReason?: string
}

interface FieldWithMetadata<T> {
  value: T
  metadata: FieldMetadata
}

interface PriceBreakdown {
  variablePerProduct: number
  fixedPerProduct: number
  totalCostPerProduct: number
  recommendedMarginPercent: number
}

interface FinalReview {
  name: string
  rating: number
  text: string
}

export type FieldChange = {
  field: string
  prevValue: any
  nextValue: any
  confidence?: number
  reason?: string
  timestamp: number
  appliedBy: "ai" | "user"
  changeId: string
}

interface AppState {
  productName: FieldWithMetadata<string>
  description: FieldWithMetadata<string>
  feature: FieldWithMetadata<string>
  targetCustomer: FieldWithMetadata<string>
  materialCost: FieldWithMetadata<number>
  packagingCost: FieldWithMetadata<number>
  extraCost: FieldWithMetadata<number>
  finalPrice: FieldWithMetadata<number>
  totalCost: number
  suggestedPrice: FieldWithMetadata<number>
  profitMargin: number
  // Pricing recommendation fields
  pricePosition?: FieldWithMetadata<"budget" | "fair" | "premium">
  pricingExplanation?: FieldWithMetadata<string>
  priceBreakdown?: PriceBreakdown
  // Cost calculation fields
  batchSize?: number
  // Value Lab fields
  quality?: FieldWithMetadata<number>
  uniqueness?: FieldWithMetadata<number>
  effort?: FieldWithMetadata<number>
  // Final page fields
  finalRating?: FieldWithMetadata<number>
  finalReviews?: FinalReview[]
  finalFeedback?: FieldWithMetadata<string>
  finalSummary?: FieldWithMetadata<string>
  finalGenerated?: boolean
  // Change tracking
  changeLog: FieldChange[]
  lastAIChangeIds: string[]
  undoStack: FieldChange[][]
  fieldTouchedByUser: Record<string, boolean>
}

interface AppStateContextType {
  state: AppState
  updateProductName: (value: string, source?: "user" | "ai") => void
  updateDescription: (value: string, source?: "user" | "ai") => void
  updateFeature: (value: string, source?: "user" | "ai") => void
  updateTargetCustomer: (value: string, source?: "user" | "ai") => void
  updateMaterialCost: (value: number, source?: "user" | "ai") => void
  updatePackagingCost: (value: number, source?: "user" | "ai") => void
  updateExtraCost: (value: number, source?: "user" | "ai") => void
  updateFinalPrice: (value: number, source?: "user" | "ai") => void
  updateSuggestedPrice: (value: number, source?: "user" | "ai") => void
  updatePricePosition?: (value: "budget" | "fair" | "premium", source?: "user" | "ai") => void
  updatePricingExplanation?: (value: string, source?: "user" | "ai") => void
  updateBatchSize?: (value: number) => void
  updateQuality?: (value: number, source?: "user" | "ai") => void
  updateUniqueness?: (value: number, source?: "user" | "ai") => void
  updateEffort?: (value: number, source?: "user" | "ai") => void
  applyAIChanges: (changes: Array<{
    field: string
    value: string | number
    confidence: number
    reason: string
  }>, allowOverwrite?: boolean) => { applied: number; skipped: number }
  getFieldMetadata: (fieldName: string) => FieldMetadata | undefined
  calculateCostBreakdown: () => PriceBreakdown
  requestPricingRecommendation: () => Promise<void>
  generateFinalOutput: () => Promise<void>
  undoLastAIBatch: () => { reverted: number; skipped: number }
  undoSpecificChange: (changeId: string) => { reverted: boolean; skipped: boolean }
  undoAllAIChanges: () => { reverted: number; skipped: number }
  markFieldTouched: (field: string) => void
  calculatePrice: () => void
  resetGame: () => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

const STORAGE_KEY = 'priceit-app-state'

const createField = <T,>(value: T, metadata?: Partial<FieldMetadata>): FieldWithMetadata<T> => ({
  value,
  metadata: {
    lastUpdatedBy: metadata?.lastUpdatedBy || "user",
    aiConfidence: metadata?.aiConfidence,
    aiReason: metadata?.aiReason,
  }
})

const initialState: AppState = {
  productName: createField(''),
  description: createField(''),
  feature: createField(''),
  targetCustomer: createField(''),
  materialCost: createField(0),
  packagingCost: createField(0),
  extraCost: createField(0),
  finalPrice: createField(0),
  totalCost: 0,
  suggestedPrice: createField(0),
  profitMargin: 0,
  changeLog: [],
  lastAIChangeIds: [],
  undoStack: [],
  fieldTouchedByUser: {},
}

// Load state from localStorage with migration support
const loadStateFromStorage = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      
      // Migrate old format (plain values) to new format (with metadata)
      const migrateField = <T,>(fieldName: string, defaultValue: T): FieldWithMetadata<T> => {
        if (parsed[fieldName] && typeof parsed[fieldName] === 'object' && 'value' in parsed[fieldName]) {
          return parsed[fieldName] as FieldWithMetadata<T>
        }
        // Old format - migrate it
        return createField(parsed[fieldName] ?? defaultValue)
      }
      
      return {
        ...initialState,
        productName: migrateField('productName', ''),
        description: migrateField('description', ''),
        feature: migrateField('feature', ''),
        targetCustomer: migrateField('targetCustomer', ''),
        materialCost: migrateField('materialCost', 0),
        packagingCost: migrateField('packagingCost', 0),
        extraCost: migrateField('extraCost', 0),
        finalPrice: migrateField('finalPrice', 0),
        totalCost: parsed.totalCost ?? 0,
        suggestedPrice: migrateField('suggestedPrice', 0),
        profitMargin: parsed.profitMargin ?? 0,
        batchSize: parsed.batchSize ?? 20,
        pricePosition: parsed.pricePosition ? migrateField('pricePosition', 'fair' as const) : undefined,
        pricingExplanation: parsed.pricingExplanation ? migrateField('pricingExplanation', '') : undefined,
        priceBreakdown: parsed.priceBreakdown,
        changeLog: parsed.changeLog || [],
        lastAIChangeIds: parsed.lastAIChangeIds || [],
        undoStack: parsed.undoStack || [],
        fieldTouchedByUser: parsed.fieldTouchedByUser || {},
      }
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error)
  }
  return initialState
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadStateFromStorage())

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save state to localStorage:', error)
    }
  }, [state])

  const updateProductName = (value: string, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      productName: {
        value,
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { 
            aiConfidence: prev.productName.metadata.aiConfidence, 
            aiReason: prev.productName.metadata.aiReason 
          })
        }
      },
      ...(source === "user" ? {
        fieldTouchedByUser: {
          ...prev.fieldTouchedByUser,
          productName: true
        }
      } : {})
    }))
  }

  const updateDescription = (value: string, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      description: {
        value,
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.description.metadata.aiConfidence, aiReason: prev.description.metadata.aiReason })
        }
      },
      ...(source === "user" ? {
        fieldTouchedByUser: {
          ...prev.fieldTouchedByUser,
          description: true
        }
      } : {})
    }))
  }

  const updateFeature = (value: string, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      feature: {
        value,
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.feature.metadata.aiConfidence, aiReason: prev.feature.metadata.aiReason })
        }
      },
      ...(source === "user" ? {
        fieldTouchedByUser: {
          ...prev.fieldTouchedByUser,
          feature: true
        }
      } : {})
    }))
  }

  const updateTargetCustomer = (value: string, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      targetCustomer: {
        value,
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.targetCustomer.metadata.aiConfidence, aiReason: prev.targetCustomer.metadata.aiReason })
        }
      },
      ...(source === "user" ? {
        fieldTouchedByUser: {
          ...prev.fieldTouchedByUser,
          targetCustomer: true
        }
      } : {})
    }))
  }

  const updateMaterialCost = (value: number, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      materialCost: {
        value: Math.max(0, value),
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.materialCost.metadata.aiConfidence, aiReason: prev.materialCost.metadata.aiReason })
        }
      }
    }))
  }

  const updatePackagingCost = (value: number, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      packagingCost: {
        value: Math.max(0, value),
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.packagingCost.metadata.aiConfidence, aiReason: prev.packagingCost.metadata.aiReason })
        }
      }
    }))
  }

  const updateExtraCost = (value: number, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      extraCost: {
        value: Math.max(0, value),
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.extraCost.metadata.aiConfidence, aiReason: prev.extraCost.metadata.aiReason })
        }
      }
    }))
  }

  const updateFinalPrice = (value: number, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      finalPrice: {
        value: Math.max(0, value),
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.finalPrice.metadata.aiConfidence, aiReason: prev.finalPrice.metadata.aiReason })
        }
      }
    }))
  }

  const updateSuggestedPrice = (value: number, source: "user" | "ai" = "user") => {
    setState(prev => {
      // Round to nearest 0.50 for consumer-friendly pricing
      const rounded = Math.round(value * 2) / 2
      return {
        ...prev,
        suggestedPrice: {
          value: Math.max(0, rounded),
          metadata: {
            lastUpdatedBy: source,
            ...(source === "user" ? {} : { aiConfidence: prev.suggestedPrice.metadata.aiConfidence, aiReason: prev.suggestedPrice.metadata.aiReason })
          }
        }
      }
    })
  }

  const updatePricePosition = (value: "budget" | "fair" | "premium", source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      pricePosition: {
        value,
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.pricePosition?.metadata.aiConfidence, aiReason: prev.pricePosition?.metadata.aiReason })
        }
      }
    }))
  }

  const updatePricingExplanation = (value: string, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      pricingExplanation: {
        value,
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.pricingExplanation?.metadata.aiConfidence, aiReason: prev.pricingExplanation?.metadata.aiReason })
        }
      }
    }))
  }

  const updateBatchSize = (value: number) => {
    setState(prev => ({
      ...prev,
      batchSize: Math.max(1, value)
    }))
  }

  const updateQuality = (value: number, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      quality: {
        value: Math.max(1, Math.min(3, value)),
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.quality?.metadata.aiConfidence, aiReason: prev.quality?.metadata.aiReason })
        }
      }
    }))
  }

  const updateUniqueness = (value: number, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      uniqueness: {
        value: Math.max(1, Math.min(3, value)),
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.uniqueness?.metadata.aiConfidence, aiReason: prev.uniqueness?.metadata.aiReason })
        }
      }
    }))
  }

  const updateEffort = (value: number, source: "user" | "ai" = "user") => {
    setState(prev => ({
      ...prev,
      effort: {
        value: Math.max(1, Math.min(3, value)),
        metadata: {
          lastUpdatedBy: source,
          ...(source === "user" ? {} : { aiConfidence: prev.effort?.metadata.aiConfidence, aiReason: prev.effort?.metadata.aiReason })
        }
      }
    }))
  }

  const getFieldMetadata = (fieldName: string): FieldMetadata | undefined => {
    const field = (state as any)[fieldName]
    if (field && typeof field === 'object' && 'metadata' in field) {
      return field.metadata
    }
    return undefined
  }

  const markFieldTouched = (field: string) => {
    setState(prev => ({
      ...prev,
      fieldTouchedByUser: {
        ...prev.fieldTouchedByUser,
        [field]: true
      }
    }))
  }

  const applyAIChanges = (
    changes: Array<{
      field: string
      value: string | number
      confidence: number
      reason: string
    }>,
    allowOverwrite: boolean = false
  ): { applied: number; skipped: number } => {
    let applied = 0
    let skipped = 0

    const validFields = [
      'productName', 'description', 'feature', 'targetCustomer',
      'materialCost', 'packagingCost', 'extraCost', 'finalPrice',
      'suggestedPrice', 'pricePosition', 'pricingExplanation',
      'quality', 'uniqueness', 'effort'
    ]

    // Batch all updates into a single setState call
    setState(prev => {
      const updates: Partial<AppState> = {}

      changes.forEach(change => {
        // Validate field exists
        if (!validFields.includes(change.field)) {
          skipped++
          return
        }

        // Check if user has edited this field
        const field = (prev as any)[change.field]
        if (field && field.metadata && field.metadata.lastUpdatedBy === "user" && !allowOverwrite) {
          skipped++
          return
        }

        // Validate confidence
        if (change.confidence < 0 || change.confidence > 1) {
          skipped++
          return
        }

        // Capture previous value
        const prevValue = field?.value ?? (field ?? undefined)
        
        // Prepare metadata
        const metadata = {
          lastUpdatedBy: "ai" as const,
          aiConfidence: change.confidence,
          aiReason: change.reason
        }

        // Apply change based on field type
        const value = change.value
        const changeId = generateChangeId()
        switch (change.field) {
          case 'productName':
            updates.productName = { value: String(value), metadata }
            applied++
            break
          case 'description':
            updates.description = { value: String(value), metadata }
            applied++
            break
          case 'feature':
            updates.feature = { value: String(value), metadata }
            applied++
            break
          case 'targetCustomer':
            updates.targetCustomer = { value: String(value), metadata }
            applied++
            break
          case 'materialCost':
            updates.materialCost = { value: Math.max(0, Number(value)), metadata }
            applied++
            break
          case 'packagingCost':
            updates.packagingCost = { value: Math.max(0, Number(value)), metadata }
            applied++
            break
          case 'extraCost':
            updates.extraCost = { value: Math.max(0, Number(value)), metadata }
            applied++
            break
          case 'finalPrice':
            updates.finalPrice = { value: Math.max(0, Number(value)), metadata }
            applied++
            break
          case 'quality':
            updates.quality = { value: Math.max(1, Math.min(3, Number(value))), metadata }
            applied++
            break
          case 'uniqueness':
            updates.uniqueness = { value: Math.max(1, Math.min(3, Number(value))), metadata }
            applied++
            break
        case 'effort':
          updates.effort = { value: Math.max(1, Math.min(3, Number(value))), metadata }
          applied++
          break
        case 'suggestedPrice':
          // Round to nearest 0.50 and ensure >= totalCostPerProduct
          // Calculate cost breakdown inline
          const variablePerProduct = (prev.materialCost?.value || 0) + (prev.packagingCost?.value || 0)
          const fixedPerProduct = prev.batchSize && prev.batchSize > 0 
            ? (prev.extraCost?.value || 0) / prev.batchSize 
            : (prev.extraCost?.value || 0)
          const totalCostPerProduct = variablePerProduct + fixedPerProduct
          const rawPrice = Math.max(totalCostPerProduct, Number(value))
          const rounded = Math.round(rawPrice * 2) / 2
          updates.suggestedPrice = { value: rounded, metadata }
          applied++
          break
        case 'pricePosition':
          if (value === 'budget' || value === 'fair' || value === 'premium') {
            updates.pricePosition = { value, metadata }
            applied++
          } else {
            skipped++
          }
          break
        case 'pricingExplanation':
          updates.pricingExplanation = { value: String(value), metadata }
          applied++
          break
        default:
          skipped++
      }

        // Record change if value actually changed
        if (prevValue !== value) {
          changeBatch.push({
            field: change.field,
            prevValue,
            nextValue: value,
            confidence: change.confidence,
            reason: change.reason,
            timestamp: Date.now(),
            appliedBy: "ai",
            changeId
          })
          changeIds.push(changeId)
        }
      })

      // Limit batch size to prevent memory bloat
      const maxBatchSize = 50
      const trimmedBatch = changeBatch.slice(-maxBatchSize)

      // Update change log and undo stack
      const newChangeLog = [...prev.changeLog, ...trimmedBatch].slice(-200) // Keep last 200 changes
      const newUndoStack = [...prev.undoStack, trimmedBatch].slice(-50) // Keep last 50 batches

      return {
        ...prev,
        ...updates,
        changeLog: newChangeLog,
        lastAIChangeIds: changeIds,
        undoStack: newUndoStack
      }
    })

    return { applied, skipped }
  }

  // Deterministic cost breakdown calculator (no AI needed)
  const calculateCostBreakdown = (): PriceBreakdown => {
    const variablePerProduct = state.materialCost.value + state.packagingCost.value
    const fixedPerProduct = state.batchSize && state.batchSize > 0 
      ? state.extraCost.value / state.batchSize 
      : state.extraCost.value
    const totalCostPerProduct = variablePerProduct + fixedPerProduct
    
    // Simple margin recommendation based on value
    const valueScore = (state.quality?.value || 2) + (state.uniqueness?.value || 2) + (state.effort?.value || 2)
    let recommendedMarginPercent = 50 // Default 50% margin
    if (valueScore <= 4) {
      recommendedMarginPercent = 30 // Lower margin for low value
    } else if (valueScore >= 8) {
      recommendedMarginPercent = 80 // Higher margin for high value
    }

    return {
      variablePerProduct: Math.max(0, variablePerProduct),
      fixedPerProduct: Math.max(0, fixedPerProduct),
      totalCostPerProduct: Math.max(0, totalCostPerProduct),
      recommendedMarginPercent
    }
  }

  // Generate final output (rating, reviews, feedback)
  const generateFinalOutput = async (): Promise<void> => {
    // Don't regenerate if already generated
    if (state.finalGenerated) {
      return
    }

    // Calculate value level
    const valueScore = (state.quality?.value || 2) + (state.uniqueness?.value || 2) + (state.effort?.value || 2)
    const valueLevel = valueScore <= 4 ? "low" : valueScore <= 7 ? "medium" : "high"
    
    // Get cost breakdown
    const costBreakdown = calculateCostBreakdown()

    // Build context for AI
    const context = {
      productName: state.productName.value,
      description: state.description.value,
      targetCustomer: state.targetCustomer.value,
      suggestedPrice: state.suggestedPrice.value,
      totalCostPerProduct: costBreakdown.totalCostPerProduct,
      valueLevel,
      pricePosition: state.pricePosition?.value || "fair"
    }

    try {
      // Call final generation endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/priceit/final`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate final output')
      }

      const data = await response.json()
      
      // Validate and store results
      const rating = Math.max(0, Math.min(5, Number(data.rating || 4.0)))
      const roundedRating = Math.round(rating * 10) / 10
      
      // Ensure exactly 10 reviews
      let reviews = Array.isArray(data.reviews) ? data.reviews : []
      if (reviews.length > 10) {
        reviews = reviews.slice(0, 10)
      } else if (reviews.length < 10) {
        // Pad with generic reviews
        const genericReviews = [
          { name: "Sam", rating: 4, text: "Pretty good product!" },
          { name: "Jordan", rating: 5, text: "I really liked it." },
          { name: "Casey", rating: 3, text: "It's okay, could be better." }
        ]
        while (reviews.length < 10) {
          reviews.push(genericReviews[reviews.length % genericReviews.length])
        }
      }

      // Validate each review
      reviews = reviews.map((review: any) => ({
        name: String(review.name || "Customer").substring(0, 20),
        rating: Math.max(1, Math.min(5, Math.round(Number(review.rating || 4)))),
        text: String(review.text || "Good product!").substring(0, 200)
      }))

      const feedback = String(data.feedback || "This is a great product idea! Keep working on it.").substring(0, 500)
      const summary = String(data.summary || "").substring(0, 200)

      // Store in state
      setState(prev => ({
        ...prev,
        finalRating: {
          value: roundedRating,
          metadata: {
            lastUpdatedBy: "ai",
            aiConfidence: 0.8,
            aiReason: "Generated based on product details"
          }
        },
        finalReviews: reviews,
        finalFeedback: {
          value: feedback,
          metadata: {
            lastUpdatedBy: "ai",
            aiConfidence: 0.8,
            aiReason: "Generated based on product details"
          }
        },
        finalSummary: summary ? {
          value: summary,
          metadata: {
            lastUpdatedBy: "ai",
            aiConfidence: 0.8,
            aiReason: "Generated based on product details"
          }
        } : undefined,
        finalGenerated: true
      }))
    } catch (error) {
      console.error('Error generating final output:', error)
      throw error
    }
  }

  // AI pricing recommendation function
  const requestPricingRecommendation = async (): Promise<void> => {
    const costBreakdown = calculateCostBreakdown()
    
    // Build context for AI
    const context = {
      productName: state.productName.value,
      targetCustomer: state.targetCustomer.value,
      quality: state.quality?.value || 2,
      uniqueness: state.uniqueness?.value || 2,
      effort: state.effort?.value || 2,
      costBreakdown
    }

    try {
      // Call AI pricing endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/priceit/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get pricing recommendation')
      }

      const data = await response.json()
      if (data.changes && Array.isArray(data.changes)) {
        // Apply changes
        const result = applyAIChanges(data.changes)
        // Update price breakdown
        setState(prev => ({
          ...prev,
          priceBreakdown: costBreakdown
        }))
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error requesting pricing recommendation:', error)
      throw error
    }
  }

  // Undo functions
  const undoLastAIBatch = (): { reverted: number; skipped: number } => {
    let reverted = 0
    let skipped = 0

    setState(prev => {
      if (prev.undoStack.length === 0) {
        return prev
      }

      const lastBatch = prev.undoStack[prev.undoStack.length - 1]
      const updates: Partial<AppState> = {}
      const newUndoStack = prev.undoStack.slice(0, -1)
      const newLastAIChangeIds: string[] = []

      // Revert changes in reverse order
      for (let i = lastBatch.length - 1; i >= 0; i--) {
        const change = lastBatch[i]
        
        // Skip if user has touched this field
        if (prev.fieldTouchedByUser[change.field]) {
          skipped++
          continue
        }

        // Revert field value
        const field = (prev as any)[change.field]
        if (field && typeof field === 'object' && 'value' in field) {
          // Field with metadata
          updates[change.field as keyof AppState] = {
            value: change.prevValue,
            metadata: {
              lastUpdatedBy: "user",
              // Clear AI markers
            }
          } as any
        } else {
          // Plain field
          updates[change.field as keyof AppState] = change.prevValue as any
        }
        reverted++
      }

      return {
        ...prev,
        ...updates,
        undoStack: newUndoStack,
        lastAIChangeIds: newLastAIChangeIds
      }
    })

    return { reverted, skipped }
  }

  const undoSpecificChange = (changeId: string): { reverted: boolean; skipped: boolean } => {
    let reverted = false
    let skipped = false

    setState(prev => {
      const change = prev.changeLog.find(c => c.changeId === changeId)
      if (!change || change.appliedBy !== "ai") {
        skipped = true
        return prev
      }

      // Skip if user has touched this field
      if (prev.fieldTouchedByUser[change.field]) {
        skipped = true
        return prev
      }

      const updates: Partial<AppState> = {}
      const field = (prev as any)[change.field]
      
      if (field && typeof field === 'object' && 'value' in field) {
        updates[change.field as keyof AppState] = {
          value: change.prevValue,
          metadata: {
            lastUpdatedBy: "user",
          }
        } as any
      } else {
        updates[change.field as keyof AppState] = change.prevValue as any
      }

      reverted = true
      return {
        ...prev,
        ...updates
      }
    })

    return { reverted, skipped }
  }

  const undoAllAIChanges = (): { reverted: number; skipped: number } => {
    let reverted = 0
    let skipped = 0

    setState(prev => {
      const updates: Partial<AppState> = {}
      const processedFields = new Set<string>()

      // Iterate through undo stack from newest to oldest
      for (let batchIdx = prev.undoStack.length - 1; batchIdx >= 0; batchIdx--) {
        const batch = prev.undoStack[batchIdx]
        
        for (let i = batch.length - 1; i >= 0; i--) {
          const change = batch[i]
          
          // Skip if already processed or user has touched
          if (processedFields.has(change.field) || prev.fieldTouchedByUser[change.field]) {
            skipped++
            continue
          }

          const field = (prev as any)[change.field]
          if (field && typeof field === 'object' && 'value' in field) {
            updates[change.field as keyof AppState] = {
              value: change.prevValue,
              metadata: {
                lastUpdatedBy: "user",
              }
            } as any
          } else {
            updates[change.field as keyof AppState] = change.prevValue as any
          }

          processedFields.add(change.field)
          reverted++
        }
      }

      return {
        ...prev,
        ...updates,
        undoStack: [],
        lastAIChangeIds: []
      }
    })

    return { reverted, skipped }
  }

  const calculatePrice = () => {
    setState(prev => {
      const totalCost = prev.materialCost.value + prev.packagingCost.value + prev.extraCost.value
      const suggestedPrice = totalCost * 1.8
      const profitMargin = suggestedPrice > 0 ? (suggestedPrice - totalCost) / suggestedPrice : 0

      return {
        ...prev,
        totalCost,
        suggestedPrice: {
          value: suggestedPrice,
          metadata: {
            lastUpdatedBy: "user",
            // Preserve AI metadata if it exists
            ...(prev.suggestedPrice.metadata.lastUpdatedBy === "ai" ? {
              aiConfidence: prev.suggestedPrice.metadata.aiConfidence,
              aiReason: prev.suggestedPrice.metadata.aiReason
            } : {})
          }
        },
        profitMargin,
        finalPrice: { 
          value: suggestedPrice,
          metadata: {
            lastUpdatedBy: "user",
            // Preserve AI metadata if it exists
            ...(prev.finalPrice.metadata.lastUpdatedBy === "ai" ? {
              aiConfidence: prev.finalPrice.metadata.aiConfidence,
              aiReason: prev.finalPrice.metadata.aiReason
            } : {})
          }
        },
      }
    })
  }

  const resetGame = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setState(initialState)
    } catch (error) {
      console.error('Failed to reset game:', error)
      // Still reset state even if localStorage removal fails
      setState(initialState)
    }
  }

  return (
    <AppStateContext.Provider
      value={{
        state,
        updateProductName,
        updateDescription,
        updateFeature,
        updateTargetCustomer,
        updateMaterialCost,
        updatePackagingCost,
        updateExtraCost,
        updateFinalPrice,
        updateSuggestedPrice,
        updatePricePosition,
        updatePricingExplanation,
        updateBatchSize,
        updateQuality,
        updateUniqueness,
        updateEffort,
        applyAIChanges,
        getFieldMetadata,
        calculateCostBreakdown,
        requestPricingRecommendation,
        generateFinalOutput,
        undoLastAIBatch,
        undoSpecificChange,
        undoAllAIChanges,
        markFieldTouched,
        calculatePrice,
        resetGame,
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}


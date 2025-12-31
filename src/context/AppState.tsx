import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AppState {
  productName: string
  description: string
  feature: string
  targetCustomer: string
  materialCost: number
  packagingCost: number
  extraCost: number
  finalPrice: number
  totalCost: number
  suggestedPrice: number
  profitMargin: number
}

interface AppStateContextType {
  state: AppState
  updateProductName: (value: string) => void
  updateDescription: (value: string) => void
  updateFeature: (value: string) => void
  updateTargetCustomer: (value: string) => void
  updateMaterialCost: (value: number) => void
  updatePackagingCost: (value: number) => void
  updateExtraCost: (value: number) => void
  updateFinalPrice: (value: number) => void
  calculatePrice: () => void
  resetGame: () => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

const STORAGE_KEY = 'priceit-app-state'

const initialState: AppState = {
  productName: '',
  description: '',
  feature: '',
  targetCustomer: '',
  materialCost: 0,
  packagingCost: 0,
  extraCost: 0,
  finalPrice: 0,
  totalCost: 0,
  suggestedPrice: 0,
  profitMargin: 0,
}

// Load state from localStorage
const loadStateFromStorage = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate and merge with initial state to ensure all fields exist
      return { ...initialState, ...parsed }
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

  const updateProductName = (value: string) => {
    setState(prev => ({ ...prev, productName: value }))
  }

  const updateDescription = (value: string) => {
    setState(prev => ({ ...prev, description: value }))
  }

  const updateFeature = (value: string) => {
    setState(prev => ({ ...prev, feature: value }))
  }

  const updateTargetCustomer = (value: string) => {
    setState(prev => ({ ...prev, targetCustomer: value }))
  }

  const updateMaterialCost = (value: number) => {
    setState(prev => ({ ...prev, materialCost: value }))
  }

  const updatePackagingCost = (value: number) => {
    setState(prev => ({ ...prev, packagingCost: value }))
  }

  const updateExtraCost = (value: number) => {
    setState(prev => ({ ...prev, extraCost: value }))
  }

  const updateFinalPrice = (value: number) => {
    setState(prev => ({ ...prev, finalPrice: value }))
  }

  const calculatePrice = () => {
    setState(prev => {
      const totalCost = prev.materialCost + prev.packagingCost + prev.extraCost
      const suggestedPrice = totalCost * 1.8
      const profitMargin = suggestedPrice > 0 ? (suggestedPrice - totalCost) / suggestedPrice : 0

      return {
        ...prev,
        totalCost,
        suggestedPrice,
        profitMargin,
        finalPrice: suggestedPrice, // Also update finalPrice with suggestedPrice
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


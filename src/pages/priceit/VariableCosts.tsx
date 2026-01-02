import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCube, FaBox, FaTrash, FaPlus, FaArrowRight } from 'react-icons/fa'
import { useSound } from '../../hooks/useSound'
import { useAppState } from '../../context/AppState'
import ProgressBar from '../../components/priceit/ProgressBar'

interface VariableCostItem {
  id: string
  name: string
  purchaseCost: number
  productsPerPurchase: number
}

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const safeNumber = (value: string, defaultValue: number = 0, min: number = 0): number => {
  const num = parseFloat(value) || defaultValue
  return Math.max(min, num)
}

const VariableCosts = () => {
  const navigate = useNavigate()
  const playSound = useSound({ volume: 0.2 })
  const { updateMaterialCost, updatePackagingCost } = useAppState()

  const [materialsItems, setMaterialsItems] = useState<VariableCostItem[]>([
    { id: generateId(), name: '', purchaseCost: 0, productsPerPurchase: 1 }
  ])
  const [packagingItems, setPackagingItems] = useState<VariableCostItem[]>([
    { id: generateId(), name: '', purchaseCost: 0, productsPerPurchase: 1 }
  ])

  // Calculate per-product costs
  const materialsPerProduct = materialsItems.reduce((sum, item) => {
    const cost = item.purchaseCost || 0
    const perPurchase = item.productsPerPurchase || 1
    return sum + (cost / perPurchase)
  }, 0)

  const packagingPerProduct = packagingItems.reduce((sum, item) => {
    const cost = item.purchaseCost || 0
    const perPurchase = item.productsPerPurchase || 1
    return sum + (cost / perPurchase)
  }, 0)

  const totalVariablePerProduct = materialsPerProduct + packagingPerProduct

  // Update global state only when navigating away (on explicit user action)
  // This prevents infinite loops from derived values

  // Helper to update item name
  const updateItemName = (
    items: VariableCostItem[],
    setItems: React.Dispatch<React.SetStateAction<VariableCostItem[]>>,
    itemId: string,
    name: string
  ) => {
    setItems(items.map(item => item.id === itemId ? { ...item, name } : item))
  }

  // Helper to update purchase cost
  const updatePurchaseCost = (
    items: VariableCostItem[],
    setItems: React.Dispatch<React.SetStateAction<VariableCostItem[]>>,
    itemId: string,
    cost: string
  ) => {
    const numValue = safeNumber(cost, 0, 0)
    setItems(items.map(item => item.id === itemId ? { ...item, purchaseCost: numValue } : item))
  }

  // Helper to update products per purchase
  const updateProductsPerPurchase = (
    items: VariableCostItem[],
    setItems: React.Dispatch<React.SetStateAction<VariableCostItem[]>>,
    itemId: string,
    value: string
  ) => {
    const numValue = safeNumber(value, 1, 1) // Min 1, default 1
    setItems(items.map(item => item.id === itemId ? { ...item, productsPerPurchase: numValue } : item))
  }

  // Helper to add item
  const addItem = (
    items: VariableCostItem[],
    setItems: React.Dispatch<React.SetStateAction<VariableCostItem[]>>
  ) => {
    playSound()
    setItems([...items, { id: generateId(), name: '', purchaseCost: 0, productsPerPurchase: 1 }])
  }

  // Helper to remove item
  const removeItem = (
    items: VariableCostItem[],
    setItems: React.Dispatch<React.SetStateAction<VariableCostItem[]>>,
    itemId: string
  ) => {
    if (items.length <= 1) {
      setItems([{ id: generateId(), name: '', purchaseCost: 0, productsPerPurchase: 1 }])
    } else {
      setItems(items.filter(item => item.id !== itemId))
    }
    playSound()
  }

  // Render a variable cost section
  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: VariableCostItem[],
    setItems: React.Dispatch<React.SetStateAction<VariableCostItem[]>>,
    perProduct: number,
    delay: number
  ) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="bg-white p-6 rounded-3xl shadow-md border border-purple-100 flex flex-col gap-4 w-full max-w-2xl transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">{icon}</span></div>
          <h3 className="text-xl font-semibold text-purple-600">{title}</h3>
        </div>

        {/* Items List */}
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: delay + index * 0.05 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100"
            >
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItemName(items, setItems, item.id, e.target.value)}
                placeholder="Item name..."
                className="flex-1 w-full sm:w-auto px-4 py-2 border border-purple-300 rounded-lg text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
              <div className="flex items-center gap-2">
                <span className="text-purple-600 font-semibold text-sm whitespace-nowrap">Cost:</span>
                <span className="text-purple-600 font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.purchaseCost || ''}
                  onChange={(e) => updatePurchaseCost(items, setItems, item.id, e.target.value)}
                  placeholder="0.00"
                  className="w-24 px-3 py-2 border border-purple-300 rounded-lg text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-600 font-semibold text-sm whitespace-nowrap">Makes:</span>
                <input
                  type="number"
                  min="1"
                  value={item.productsPerPurchase || ''}
                  onChange={(e) => updateProductsPerPurchase(items, setItems, item.id, e.target.value)}
                  placeholder="1"
                  className="w-20 px-3 py-2 border border-purple-300 rounded-lg text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                <span className="text-gray-500 text-sm">products</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeItem(items, setItems, item.id)}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 -ml-[6.5px]"
                title="Remove item"
              >
                <FaTrash className="text-lg" />
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Add Item Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => addItem(items, setItems)}
          className="mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-semibold transition-colors"
        >
          <FaPlus className="text-sm" />
          Add item
        </motion.button>

        {/* Per Product Subtotal */}
        <div className="mt-4 pt-4 border-t-2 border-purple-200 flex justify-between items-center">
          <span className="text-lg font-semibold text-purple-700">Per product:</span>
          <span className="text-2xl font-bold text-purple-600">
            ${perProduct.toFixed(2)}
          </span>
        </div>
      </motion.div>
    )
  }

  const handleNext = () => {
    playSound()
    // Update global state only when user explicitly navigates (not on every render)
    if (updateMaterialCost) {
      updateMaterialCost(materialsPerProduct, "user")
    }
    if (updatePackagingCost) {
      updatePackagingCost(packagingPerProduct, "user")
    }
    navigate('/priceit/fixed-costs')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden opacity-0 translate-y-4 animate-[fadeIn_0.4s_ease-out_forwards]">
      <ProgressBar />
      <div className="flex flex-col items-center gap-8 pt-12 pb-8">
        {/* Decorative Background Blobs */}
        <div className="absolute top-32 left-16 w-56 h-56 bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-24 right-20 w-48 h-48 bg-purple-400 rounded-full opacity-20 blur-3xl"></div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center z-10"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-5xl font-bold text-purple-600 flex items-center justify-center gap-3"
          >
            Variable Costs
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-lg text-gray-600 mt-2 max-w-2xl"
          >
            These costs change based on how many products you make. Enter what you buy and how many products it makes!
          </motion.p>
        </motion.div>

        {/* Cost Input Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-6 w-full max-w-4xl px-6 z-10"
        >
          {renderSection(
            'Materials',
            <FaCube className="text-blue-500" />,
            materialsItems,
            setMaterialsItems,
            materialsPerProduct,
            0.2
          )}

          {renderSection(
            'Packaging',
            <FaBox className="text-green-500" />,
            packagingItems,
            setPackagingItems,
            packagingPerProduct,
            0.3
          )}
        </motion.div>

        {/* Summary Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-6 w-full max-w-2xl px-6 z-10"
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl p-6 shadow-xl border-2 border-purple-400 ring-1 ring-purple-100">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-white">Materials per product:</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(materialsPerProduct)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-white">Packaging per product:</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(packagingPerProduct)}</span>
              </div>
              <div className="pt-3 border-t-2 border-purple-400 flex justify-between items-center">
                <span className="text-2xl font-bold text-white">Total variable cost per product:</span>
                <span className="text-3xl font-bold text-white">{formatCurrency(totalVariablePerProduct)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className="mt-6 bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 z-10 flex items-center gap-2"
        >
          Next: Fixed Costs <FaArrowRight className="text-white" />
        </motion.button>
      </div>
    </div>
  )
}

export default VariableCosts


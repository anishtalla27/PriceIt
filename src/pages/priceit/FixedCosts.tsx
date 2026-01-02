import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBriefcase, FaTrash, FaPlus, FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import { useSound } from '../../hooks/useSound'
import { useAppState } from '../../context/AppState'
import ProgressBar from '../../components/priceit/ProgressBar'

interface FixedCostItem {
  id: string
  name: string
  cost: number
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

const FixedCosts = () => {
  const navigate = useNavigate()
  const playSound = useSound({ volume: 0.2 })
  const { state, updateBatchSize, updateExtraCost } = useAppState()

  const [fixedItems, setFixedItems] = useState<FixedCostItem[]>([
    { id: generateId(), name: '', cost: 0 }
  ])
  const [batchSize, setBatchSize] = useState<number>(state.batchSize || 20)

  // Sync batchSize to global state
  useEffect(() => {
    if (updateBatchSize) {
      updateBatchSize(batchSize)
    }
  }, [batchSize, updateBatchSize])

  // Calculate totals
  const totalFixed = fixedItems.reduce((sum, item) => sum + (item.cost || 0), 0)
  const fixedPerProduct = batchSize > 0 ? totalFixed / batchSize : 0

  // Update global state when fixed costs change
  useEffect(() => {
    if (updateExtraCost) {
      updateExtraCost(totalFixed, "user")
    }
  }, [totalFixed, updateExtraCost])

  // Helper to update item name
  const updateItemName = (
    itemId: string,
    name: string
  ) => {
    setFixedItems(fixedItems.map(item => item.id === itemId ? { ...item, name } : item))
  }

  // Helper to update item cost
  const updateItemCost = (
    itemId: string,
    cost: string
  ) => {
    const numValue = safeNumber(cost, 0, 0)
    setFixedItems(fixedItems.map(item => item.id === itemId ? { ...item, cost: numValue } : item))
  }

  // Helper to add item
  const addItem = () => {
    playSound()
    setFixedItems([...fixedItems, { id: generateId(), name: '', cost: 0 }])
  }

  // Helper to remove item
  const removeItem = (itemId: string) => {
    if (fixedItems.length <= 1) {
      setFixedItems([{ id: generateId(), name: '', cost: 0 }])
    } else {
      setFixedItems(fixedItems.filter(item => item.id !== itemId))
    }
    playSound()
  }

  // Update batch size
  const handleBatchSizeChange = (value: string) => {
    const numValue = safeNumber(value, 20, 1)
    setBatchSize(numValue)
  }

  const handleBack = () => {
    playSound()
    navigate('/priceit/variable-costs')
  }

  const handleContinue = () => {
    playSound()
    navigate('/priceit/market')
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
            <span className="inline-block transition-transform hover:-translate-y-1"><FaBriefcase className="text-purple-500" /></span>
            Fixed Costs
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-lg text-gray-600 mt-2 max-w-2xl"
          >
            These are costs you pay once, no matter how many products you make. Like tools or equipment!
          </motion.p>
        </motion.div>

        {/* Fixed Costs Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white p-6 rounded-3xl shadow-md border border-purple-100 flex flex-col gap-4 w-full max-w-2xl z-10 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-purple-600">Fixed Cost Items</h3>
          </div>

          {/* Items List */}
          <div className="flex flex-col gap-3">
            {fixedItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100"
              >
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItemName(item.id, e.target.value)}
                  placeholder="Item name..."
                  className="flex-1 px-4 py-2 border border-purple-300 rounded-lg text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.cost || ''}
                    onChange={(e) => updateItemCost(item.id, e.target.value)}
                    placeholder="0.00"
                    className="w-32 px-3 py-2 border border-purple-300 rounded-lg text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            onClick={addItem}
            className="mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-semibold transition-colors"
          >
            <FaPlus className="text-sm" />
            Add item
          </motion.button>
        </motion.div>

        {/* Summary Panel with Batch Size */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 w-full max-w-2xl px-6 z-10"
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl p-6 shadow-xl border-2 border-purple-400 ring-1 ring-purple-100">
            <div className="flex flex-col gap-4">
              {/* Batch Size Input */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-purple-400">
                <label className="text-xl font-semibold text-white">
                  How many products will you make in this batch?
                </label>
                <input
                  type="number"
                  min="1"
                  value={batchSize}
                  onChange={(e) => handleBatchSizeChange(e.target.value)}
                  className="w-24 px-4 py-2 border-2 border-purple-300 rounded-lg text-xl font-bold text-purple-700 focus:outline-none focus:border-purple-200 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              {/* Totals */}
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-white">Total fixed costs:</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(totalFixed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-white">Batch size:</span>
                <span className="text-2xl font-bold text-white">{batchSize}</span>
              </div>
              <div className="pt-3 border-t-2 border-purple-400 flex justify-between items-center">
                <span className="text-2xl font-bold text-white">Fixed cost per product:</span>
                <span className="text-3xl font-bold text-white">{formatCurrency(fixedPerProduct)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex gap-4 mt-6 z-10"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <FaArrowLeft className="text-white" />
            Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleContinue}
            className="bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            Continue <FaArrowRight className="text-white" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default FixedCosts


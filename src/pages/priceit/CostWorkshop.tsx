import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaTools, FaCube, FaBox, FaBriefcase, FaStar, FaTrash, FaPlus } from 'react-icons/fa'
import { useAppState } from '../../context/AppState'
import { useSound } from '../../hooks/useSound'
import ProgressBar from '../../components/priceit/ProgressBar'

interface CostItem {
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

const CostWorkshop = () => {
  const { updateMaterialCost, updatePackagingCost, updateExtraCost } = useAppState()
  const navigate = useNavigate()
  const playSound = useSound({ volume: 0.2 })

  const [materialsItems, setMaterialsItems] = useState<CostItem[]>([
    { id: generateId(), name: '', cost: 0 }
  ])
  const [packagingItems, setPackagingItems] = useState<CostItem[]>([
    { id: generateId(), name: '', cost: 0 }
  ])
  const [extraItems, setExtraItems] = useState<CostItem[]>([
    { id: generateId(), name: '', cost: 0 }
  ])

  // Calculate subtotals
  const subtotalMaterials = materialsItems.reduce((sum, item) => sum + (item.cost || 0), 0)
  const subtotalPackaging = packagingItems.reduce((sum, item) => sum + (item.cost || 0), 0)
  const subtotalExtra = extraItems.reduce((sum, item) => sum + (item.cost || 0), 0)
  const totalCost = subtotalMaterials + subtotalPackaging + subtotalExtra

  // Update context when totals change
  useEffect(() => {
    updateMaterialCost(subtotalMaterials)
  }, [subtotalMaterials, updateMaterialCost])

  useEffect(() => {
    updatePackagingCost(subtotalPackaging)
  }, [subtotalPackaging, updatePackagingCost])

  useEffect(() => {
    updateExtraCost(subtotalExtra)
  }, [subtotalExtra, updateExtraCost])

  // Helper function to update item name
  const updateItemName = (
    items: CostItem[],
    setItems: React.Dispatch<React.SetStateAction<CostItem[]>>,
    itemId: string,
    name: string
  ) => {
    setItems(items.map(item => item.id === itemId ? { ...item, name } : item))
  }

  // Helper function to update item cost
  const updateItemCost = (
    items: CostItem[],
    setItems: React.Dispatch<React.SetStateAction<CostItem[]>>,
    itemId: string,
    cost: string
  ) => {
    const numValue = Math.max(0, parseFloat(cost) || 0)
    setItems(items.map(item => item.id === itemId ? { ...item, cost: numValue } : item))
  }

  // Helper function to add item
  const addItem = (
    items: CostItem[],
    setItems: React.Dispatch<React.SetStateAction<CostItem[]>>
  ) => {
    playSound()
    setItems([...items, { id: generateId(), name: '', cost: 0 }])
  }

  // Helper function to remove item
  const removeItem = (
    items: CostItem[],
    setItems: React.Dispatch<React.SetStateAction<CostItem[]>>,
    itemId: string
  ) => {
    if (items.length <= 1) {
      // If it's the last item, replace with a fresh blank row
      setItems([{ id: generateId(), name: '', cost: 0 }])
    } else {
      setItems(items.filter(item => item.id !== itemId))
    }
    playSound()
  }

  // Render a cost section card
  const renderCostSection = (
    title: string,
    icon: React.ReactNode,
    items: CostItem[],
    setItems: React.Dispatch<React.SetStateAction<CostItem[]>>,
    subtotal: number,
    delay: number
  ) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="bg-white p-6 rounded-3xl shadow-md border border-purple-100 flex flex-col gap-4 w-full max-w-2xl"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="text-4xl">{icon}</div>
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
              className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100"
            >
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItemName(items, setItems, item.id, e.target.value)}
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
                  onChange={(e) => updateItemCost(items, setItems, item.id, e.target.value)}
                  placeholder="0.00"
                  className="w-24 px-3 py-2 border border-purple-300 rounded-lg text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeItem(items, setItems, item.id)}
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
          onClick={() => addItem(items, setItems)}
          className="mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-semibold transition-colors"
        >
          <FaPlus className="text-sm" />
          Add item
        </motion.button>

        {/* Subtotal */}
        <div className="mt-4 pt-4 border-t-2 border-purple-200 flex justify-between items-center">
          <span className="text-lg font-semibold text-purple-700">Subtotal:</span>
          <span className="text-2xl font-bold text-purple-600">
            ${subtotal.toFixed(2)}
          </span>
        </div>
      </motion.div>
    )
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
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
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
            <FaTools className="text-orange-500" />
            Cost Workshop
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-lg text-gray-600 mt-2"
          >
            Let's calculate how much it costs to make your product!
          </motion.p>
        </motion.div>

        {/* Cost Input Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-6 w-full max-w-4xl px-6 z-10"
        >
          {renderCostSection(
            'Materials Cost',
            <FaCube className="text-blue-500" />,
            materialsItems,
            setMaterialsItems,
            subtotalMaterials,
            0.2
          )}

          {renderCostSection(
            'Packaging Cost',
            <FaBox className="text-green-500" />,
            packagingItems,
            setPackagingItems,
            subtotalPackaging,
            0.3
          )}

          {renderCostSection(
            'Extra Expenses',
            <FaBriefcase className="text-purple-500" />,
            extraItems,
            setExtraItems,
            subtotalExtra,
            0.4
          )}
        </motion.div>

        {/* Total Cost Summary Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-6 w-full max-w-2xl px-6 z-10"
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl p-6 shadow-xl border-2 border-purple-400">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-white">Total Cost:</span>
              <span className="text-4xl font-bold text-white">
                {formatCurrency(totalCost)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleContinue}
          className="mt-6 bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg hover:scale-105 transition z-10 flex items-center gap-2"
        >
          Continue <FaStar className="text-white" />
        </motion.button>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-8 z-10"
        >
          <p className="text-sm text-gray-500 text-center">
            Step 2 of 5: Calculating Costs
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default CostWorkshop

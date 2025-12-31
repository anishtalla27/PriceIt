import { motion } from 'framer-motion'
import { FaTools, FaCube, FaBox, FaBriefcase, FaStar } from 'react-icons/fa'
import { useAppState } from '../context/AppState'

const CostWorkshop = () => {
  const { state, updateMaterialCost, updatePackagingCost, updateExtraCost } = useAppState()

  const handleMaterialCostChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    updateMaterialCost(numValue)
  }

  const handlePackagingCostChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    updatePackagingCost(numValue)
  }

  const handleExtraCostChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    updateExtraCost(numValue)
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-8 pt-20 bg-white relative overflow-hidden">
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
        className="flex flex-col items-center gap-6 w-full max-w-2xl px-6 z-10"
      >
        {/* Materials Cost Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white p-6 rounded-3xl shadow-md border border-purple-100 flex flex-col gap-2 w-full max-w-sm"
        >
          <div className="text-4xl text-center flex justify-center">
            <FaCube className="text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-purple-600 text-center">Materials Cost</h3>
          <input
            type="number"
            step="0.01"
            min="0"
            value={state.materialCost || ''}
            onChange={(e) => handleMaterialCostChange(e.target.value)}
            placeholder="$0.00"
            className="border border-purple-300 rounded-xl px-4 py-2 text-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
        </motion.div>

        {/* Packaging Cost Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white p-6 rounded-3xl shadow-md border border-purple-100 flex flex-col gap-2 w-full max-w-sm"
        >
          <div className="text-4xl text-center flex justify-center">
            <FaBox className="text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-purple-600 text-center">Packaging Cost</h3>
          <input
            type="number"
            step="0.01"
            min="0"
            value={state.packagingCost || ''}
            onChange={(e) => handlePackagingCostChange(e.target.value)}
            placeholder="$0.00"
            className="border border-purple-300 rounded-xl px-4 py-2 text-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
        </motion.div>

        {/* Extra Expenses Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white p-6 rounded-3xl shadow-md border border-purple-100 flex flex-col gap-2 w-full max-w-sm"
        >
          <div className="text-4xl text-center flex justify-center">
            <FaBriefcase className="text-purple-500" />
          </div>
          <h3 className="text-xl font-semibold text-purple-600 text-center">Extra Expenses</h3>
          <p className="text-sm text-gray-500 text-center">(labor, shipping, marketing, etc.)</p>
          <input
            type="number"
            step="0.01"
            min="0"
            value={state.extraCost || ''}
            onChange={(e) => handleExtraCostChange(e.target.value)}
            placeholder="$0.00"
            className="border border-purple-300 rounded-xl px-4 py-2 text-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
        </motion.div>
      </motion.div>

      {/* Continue Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-6 bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg hover:scale-105 transition z-10 flex items-center gap-2 mx-auto"
      >
        Continue <FaStar className="text-white" />
      </motion.button>

      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-8 z-10"
      >
        <p className="text-sm text-gray-500 text-center">
          Step 2 of 5: Calculating Costs
        </p>
      </motion.div>
    </div>
  )
}

export default CostWorkshop


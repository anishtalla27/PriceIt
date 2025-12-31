import { motion } from 'framer-motion'
import { useState } from 'react'
import { FaPalette, FaPencilAlt, FaFileAlt, FaStar, FaUsers, FaCommentDots } from 'react-icons/fa'
import { useAppState } from '../context/AppState'
import { useSound } from '../hooks/useSound'

const ProductStudio = () => {
  const { state, updateProductName, updateDescription, updateFeature, updateTargetCustomer } = useAppState()
  const playSound = useSound({ volume: 0.2 })
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

  const productCards = [
    { id: 'name', Icon: FaPencilAlt, iconColor: 'text-blue-500', label: 'Product Name', question: 'What should we call your amazing product?' },
    { id: 'description', Icon: FaFileAlt, iconColor: 'text-green-500', label: 'Description', question: 'Tell us about your product in one sentence!' },
    { id: 'feature', Icon: FaStar, iconColor: 'text-yellow-500', label: 'Special Feature', question: 'What makes your product special?' },
    { id: 'customer', Icon: FaUsers, iconColor: 'text-pink-500', label: 'Target Customer', question: 'Who will love your product?' }
  ]

  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId)
    // Load existing value from state when card is selected
    switch (cardId) {
      case 'name':
        setInputValue(state.productName)
        break
      case 'description':
        setInputValue(state.description)
        break
      case 'feature':
        setInputValue(state.feature)
        break
      case 'customer':
        setInputValue(state.targetCustomer)
        break
      default:
        setInputValue('')
    }
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
  }

  const handleNext = () => {
    if (!selectedCard || !inputValue.trim()) return

    playSound()

    // Save to global state based on selected card
    switch (selectedCard) {
      case 'name':
        updateProductName(inputValue.trim())
        break
      case 'description':
        updateDescription(inputValue.trim())
        break
      case 'feature':
        updateFeature(inputValue.trim())
        break
      case 'customer':
        updateTargetCustomer(inputValue.trim())
        break
    }

    // Clear selection and input for next card
    setSelectedCard(null)
    setInputValue('')
  }

  const currentQuestion = productCards.find(card => card.id === selectedCard)?.question || 'Pick a card above to get started!'

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 relative bg-white overflow-hidden">
      {/* Decorative Background Blob */}
      <div className="absolute top-40 right-20 w-64 h-64 bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-purple-400 rounded-full opacity-20 blur-3xl"></div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12 z-10"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-5xl font-bold text-purple-600 flex items-center justify-center gap-3"
        >
          <FaPalette className="text-pink-500" />
          Product Studio
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-lg text-gray-600 mt-2"
        >
          Choose details about your product!
        </motion.p>
      </motion.div>

      {/* Product Cards Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 gap-6 max-w-3xl px-6 mb-12 z-10"
      >
        {productCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick(card.id)}
            className={`flex flex-col items-center p-6 rounded-3xl shadow-md cursor-pointer transition-all ${
              selectedCard === card.id
                ? 'bg-purple-100 border-2 border-purple-500'
                : 'bg-white border border-purple-100 hover:border-purple-300'
            }`}
          >
            <card.Icon className={`text-5xl ${card.iconColor}`} />
            <p className="mt-3 text-lg font-semibold text-purple-600">
              {card.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Chat Style Question Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="max-w-2xl w-full px-6 mb-12 z-10"
      >
        {/* Question Bubble */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="bg-purple-50 border border-purple-200 rounded-3xl p-6 mb-6 shadow-sm"
        >
          <p className="text-xl text-purple-700 font-medium text-center flex items-center justify-center gap-2">
            <FaCommentDots className="text-purple-500" />
            {currentQuestion}
          </p>
        </motion.div>

        {/* Input Field */}
        <motion.input
          whileFocus={{ scale: 1.02 }}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type your answer here..."
          disabled={!selectedCard}
          className="w-full px-6 py-4 text-lg border-2 border-purple-300 rounded-full focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Next Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className="mt-6 w-full bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg transition-transform disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={!inputValue.trim()}
        >
          Next <FaStar className="text-white" />
        </motion.button>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mb-12 z-10"
      >
        <p className="text-sm text-gray-500 text-center">
          Step 1 of 5: Building Your Product
        </p>
      </motion.div>
    </div>
  )
}

export default ProductStudio


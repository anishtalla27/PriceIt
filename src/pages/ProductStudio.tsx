import { motion } from 'framer-motion'
import { useState } from 'react'

const ProductStudio = () => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

  const productCards = [
    { id: 'name', emoji: '✏️', label: 'Product Name', question: 'What should we call your amazing product?' },
    { id: 'description', emoji: '📝', label: 'Description', question: 'Tell us about your product in one sentence!' },
    { id: 'feature', emoji: '⭐', label: 'Special Feature', question: 'What makes your product special?' },
    { id: 'customer', emoji: '👥', label: 'Target Customer', question: 'Who will love your product?' }
  ]

  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId)
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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 z-10"
      >
        <h1 className="text-5xl font-bold text-purple-600">
          🎨 Product Studio
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Choose details about your product!
        </p>
      </motion.div>

      {/* Product Cards Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-6 max-w-3xl px-6 mb-12 z-10"
      >
        {productCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick(card.id)}
            className={`flex flex-col items-center p-6 rounded-3xl shadow-md cursor-pointer transition-all ${
              selectedCard === card.id
                ? 'bg-purple-100 border-2 border-purple-500'
                : 'bg-white border border-purple-100 hover:border-purple-300'
            }`}
          >
            <div className="text-5xl">{card.emoji}</div>
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
        transition={{ delay: 0.7 }}
        className="max-w-2xl w-full px-6 mb-12 z-10"
      >
        {/* Question Bubble */}
        <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6 mb-6 shadow-sm">
          <p className="text-xl text-purple-700 font-medium text-center">
            💭 {currentQuestion}
          </p>
        </div>

        {/* Input Field */}
        <motion.input
          whileFocus={{ scale: 1.02 }}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your answer here..."
          disabled={!selectedCard}
          className="w-full px-6 py-4 text-lg border-2 border-purple-300 rounded-full focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Next Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 w-full bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg transition-transform disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={!inputValue.trim()}
        >
          Next ✨
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


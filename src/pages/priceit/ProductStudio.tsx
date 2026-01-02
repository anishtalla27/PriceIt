import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPalette, FaPencilAlt, FaFileAlt, FaStar, FaUsers, FaCommentDots } from 'react-icons/fa'
import { useAppState } from '../../context/AppState'
import { useSound } from '../../hooks/useSound'
import ProgressBar from '../../components/priceit/ProgressBar'
import { callPriceItAI } from '../../priceit/priceitAiClient'
import AIFieldIndicator from '../../components/priceit/AIFieldIndicator'

const ProductStudio = () => {
  const { state, updateProductName, updateDescription, updateFeature, updateTargetCustomer, getFieldMetadata } = useAppState()
  const navigate = useNavigate()
  const playSound = useSound({ volume: 0.2 })
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  
  // Check if all fields are filled
  const allFieldsFilled = 
    state.productName.value.trim() !== '' &&
    state.description.value.trim() !== '' &&
    state.feature.value.trim() !== '' &&
    state.targetCustomer.value.trim() !== ''

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
        setInputValue(state.productName.value)
        break
      case 'description':
        setInputValue(state.description.value)
        break
      case 'feature':
        setInputValue(state.feature.value)
        break
      case 'customer':
        setInputValue(state.targetCustomer.value)
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

    // Save to global state based on selected card (mark as user edit)
    switch (selectedCard) {
      case 'name':
        updateProductName(inputValue.trim(), "user")
        break
      case 'description':
        updateDescription(inputValue.trim(), "user")
        break
      case 'feature':
        updateFeature(inputValue.trim(), "user")
        break
      case 'customer':
        updateTargetCustomer(inputValue.trim(), "user")
        break
    }

    // Clear selection and input for next card
    setSelectedCard(null)
    setInputValue('')
    
    // Check if all fields will be filled after this update
    const willBeFilled = (() => {
      const updatedState = { ...state }
      switch (selectedCard) {
        case 'name':
          updatedState.productName = { ...updatedState.productName, value: inputValue.trim() }
          break
        case 'description':
          updatedState.description = { ...updatedState.description, value: inputValue.trim() }
          break
        case 'feature':
          updatedState.feature = { ...updatedState.feature, value: inputValue.trim() }
          break
        case 'customer':
          updatedState.targetCustomer = { ...updatedState.targetCustomer, value: inputValue.trim() }
          break
      }
      return (
        updatedState.productName.value.trim() !== '' &&
        updatedState.description.value.trim() !== '' &&
        updatedState.feature.value.trim() !== '' &&
        updatedState.targetCustomer.value.trim() !== ''
      )
    })()
    
    // If all fields are now filled, navigate to next screen
    if (willBeFilled) {
      setTimeout(() => {
        navigate('/priceit/cost')
      }, 300) // Small delay to show the update
    }
  }

  const currentQuestion = productCards.find(card => card.id === selectedCard)?.question || 'Pick a card above to get started!'

  // Test function for AI integration
  const handleTestAI = async () => {
    try {
      console.log('Testing PriceIt AI...')
      const response = await callPriceItAI([
        { role: 'user', content: 'Suggest three fun product ideas for kids who like drawing.' }
      ])
      console.log('AI Response:', response)
      alert(`AI Response:\n\n${response}`)
    } catch (error) {
      console.error('AI Test Error:', error)
      alert('Error testing AI. Check console for details.')
    }
  }

  return (
    <>
      {/* Progress Bar - Always visible at top */}
      <ProgressBar />
      <div className="min-h-screen flex flex-col bg-white overflow-hidden opacity-0 translate-y-4 animate-[fadeIn_0.4s_ease-out_forwards]">
      <div className="flex flex-col items-center pt-12 relative">
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
            className={`flex flex-col items-center p-6 rounded-3xl shadow-md cursor-pointer transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg ${
              selectedCard === card.id
                ? 'bg-purple-100 border-2 border-purple-500'
                : 'bg-white border border-purple-100 hover:border-purple-300'
            }`}
          >
            <span className="inline-block transition-transform hover:-translate-y-1"><card.Icon className={`text-5xl ${card.iconColor}`} /></span>
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
          className="bg-gradient-to-br from-purple-50 to-white ring-1 ring-purple-100 border border-purple-200 rounded-3xl p-6 mb-6 shadow-sm"
        >
          <p className="text-xl text-purple-700 font-medium text-center flex items-center justify-center gap-2">
            <span className="inline-block transition-transform hover:-translate-y-1"><FaCommentDots className="text-purple-500" /></span>
            {currentQuestion}
          </p>
        </motion.div>

        {/* Input Field */}
        <AIFieldIndicator
          metadata={selectedCard ? getFieldMetadata(selectedCard === 'name' ? 'productName' : selectedCard === 'description' ? 'description' : selectedCard === 'feature' ? 'feature' : 'targetCustomer') : undefined}
          className="relative"
        >
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type your answer here..."
            disabled={!selectedCard}
            className="w-full px-6 py-4 text-lg border-2 border-purple-300 rounded-full focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </AIFieldIndicator>

        {/* Next Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className="mt-6 w-full bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={!inputValue.trim()}
        >
          Next <span className="inline-block transition-transform hover:-translate-y-1"><FaStar className="text-white" /></span>
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
      </div>
      
      {/* Test Button for AI Integration - Fixed position, always visible */}
      <button
        onClick={handleTestAI}
        className="fixed bottom-6 right-6 bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl transition-all duration-150 hover:scale-105 active:scale-95 border-4 border-white"
        title="Test AI Integration"
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px',
          zIndex: 99999,
          backgroundColor: '#9333ea',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        🤖 Test AI
      </button>
    </>
  )
}

export default ProductStudio


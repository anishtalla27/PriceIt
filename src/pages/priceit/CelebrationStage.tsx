import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaTrophy } from 'react-icons/fa'
import { useAppState } from '../../context/AppState'
import { useSound } from '../../hooks/useSound'

export default function CelebrationStage() {
  const navigate = useNavigate()
  const { state, resetGame } = useAppState()
  const playSound = useSound({ volume: 0.2 })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const handlePlayAgain = () => {
    playSound()
    navigate('/priceit')
  }

  const handleResetGame = () => {
    playSound()
    resetGame()
    navigate('/priceit')
  }

  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center justify-center px-4 text-center overflow-hidden">
      {/* Background floating circles */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-200 opacity-30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-20 w-56 h-56 rounded-full bg-purple-200 opacity-30 blur-3xl pointer-events-none"></div>

      {/* Confetti dots */}
      <div className="absolute top-10 left-1/3 w-3 h-3 rounded-full bg-purple-400"></div>
      <div className="absolute top-20 right-1/4 w-4 h-4 rounded-full bg-purple-300"></div>
      <div className="absolute top-32 left-1/4 w-2 h-2 rounded-full bg-purple-500"></div>
      <div className="absolute bottom-32 right-1/3 w-3 h-3 rounded-full bg-purple-400"></div>
      <div className="absolute bottom-24 left-1/2 w-4 h-4 rounded-full bg-purple-300"></div>
      <div className="absolute top-1/4 right-1/5 w-3 h-3 rounded-full bg-purple-500"></div>
      <div className="absolute bottom-1/3 left-1/5 w-2 h-2 rounded-full bg-purple-400"></div>
      <div className="absolute top-1/3 right-1/3 w-4 h-4 rounded-full bg-purple-300"></div>

      {/* Success heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-5xl font-bold text-purple-600"
      >
        You Did It!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-2 text-lg text-gray-600"
      >
        Your product is ready to launch soon!
      </motion.p>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-10 bg-white rounded-3xl shadow-md border border-purple-100 p-8 w-full max-w-md flex flex-col gap-4 items-center"
      >
        <FaTrophy className="text-5xl text-yellow-500" />
        <h2 className="text-2xl font-semibold text-purple-700">Final Results</h2>
        <div className="w-full flex flex-col gap-3 items-start">
          <p className="text-gray-600 text-sm">
            <span className="font-semibold text-purple-700">Product Name:</span>{' '}
            {state.productName || '(not set)'}
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-semibold text-purple-700">Total Cost:</span>{' '}
            {formatCurrency(state.totalCost)}
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-semibold text-purple-700">Suggested Price:</span>{' '}
            {formatCurrency(state.suggestedPrice)}
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-semibold text-purple-700">Profit Margin:</span>{' '}
            {formatPercent(state.profitMargin)}
          </p>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayAgain}
            className="flex-1 bg-purple-500 text-white px-10 py-3 rounded-full text-xl font-semibold shadow-lg hover:scale-105 transition"
          >
            Play Again
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResetGame}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-10 py-3 rounded-full text-xl font-semibold shadow-lg transition"
          >
            Reset Game
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}


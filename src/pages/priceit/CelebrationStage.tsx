import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaTrophy } from 'react-icons/fa'
import { useAppState } from '../../context/AppState'
import { useSound } from '../../hooks/useSound'

// Confetti component
const Confetti = () => {
  const colors = ['bg-purple-400', 'bg-purple-300', 'bg-purple-200', 'bg-white']
  const confettiPieces = Array.from({ length: 25 }, (_, i) => {
    const size = 6 + Math.random() * 4 // 6-10px
    const left = Math.random() * 100 // 0-100%
    const top = -10 + Math.random() * 10 // -10% to 0%
    const color = colors[Math.floor(Math.random() * colors.length)]
    const duration = 2 + Math.random() * 1 // 2-3s
    const delay = Math.random() * 0.5 // 0-0.5s delay
    
    return {
      id: i,
      size,
      left,
      top,
      color,
      duration,
      delay,
    }
  })

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute ${piece.color} rounded-full pointer-events-none`}
          style={{
            left: `${piece.left}%`,
            top: `${piece.top}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            animation: `confettiFall ${piece.duration}s ease-out ${piece.delay}s forwards`,
          }}
        />
      ))}
    </>
  )
}

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={`full-${i}`} className="text-yellow-400 text-lg">★</span>
      ))}
      {hasHalfStar && <span className="text-yellow-400 text-lg">☆</span>}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={`empty-${i}`} className="text-gray-300 text-lg">★</span>
      ))}
    </div>
  )
}

export default function CelebrationStage() {
  const navigate = useNavigate()
  const { state, resetGame, generateFinalOutput } = useAppState()
  const playSound = useSound({ volume: 0.2 })
  const [showConfetti, setShowConfetti] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2500)
    return () => clearTimeout(timer)
  }, [])

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
    <div className="min-h-screen bg-white relative flex flex-col items-center justify-center px-4 text-center overflow-hidden opacity-0 translate-y-4 animate-[fadeIn_0.4s_ease-out_forwards]">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <Confetti />
        </div>
      )}

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
        className="mt-10 bg-white rounded-3xl shadow-md border border-purple-100 p-8 w-full max-w-md flex flex-col gap-4 items-center transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
      >
        <span className="inline-block transition-transform hover:-translate-y-1"><FaTrophy className="text-5xl text-yellow-500" /></span>
        <h2 className="text-2xl font-semibold text-purple-700">Final Results</h2>
        <div className="w-full flex flex-col gap-3 items-start">
          <p className="text-gray-600 text-sm">
            <span className="font-semibold text-purple-700">Product Name:</span>{' '}
            {state.productName.value || '(not set)'}
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-semibold text-purple-700">Total Cost:</span>{' '}
            {formatCurrency(state.totalCost)}
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-semibold text-purple-700">Suggested Price:</span>{' '}
            {formatCurrency(state.suggestedPrice.value || 0)}
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
            className="flex-1 bg-purple-500 text-white px-10 py-3 rounded-full text-xl font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
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
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-10 py-3 rounded-full text-xl font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
          >
            Reset Game
          </motion.button>
        </div>
      </motion.div>

      {/* Customer Buzz Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-10 w-full max-w-4xl bg-white rounded-3xl shadow-md border border-purple-100 p-8"
      >
        <h2 className="text-2xl font-semibold text-purple-700 mb-6 text-center">Customer Buzz</h2>
        
        {state.finalGenerated && state.finalRating ? (
          <>
            {/* Rating Display */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-5xl font-bold text-purple-600">
                  {state.finalRating.value.toFixed(1)}
                </span>
                <span className="text-2xl text-gray-500">/5</span>
              </div>
              <StarRating rating={state.finalRating.value} />
            </div>

            {/* Reviews List */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-purple-700 mb-4">Customer Reviews</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {state.finalReviews?.map((review, index) => (
                  <div
                    key={index}
                    className="bg-purple-50 rounded-2xl p-4 border border-purple-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-purple-700">{review.name}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm text-gray-700">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Feedback */}
            {state.finalFeedback?.value && (
              <div className="bg-gradient-to-br from-purple-50 to-white ring-1 ring-purple-100 rounded-2xl p-6 mb-4">
                <h3 className="text-lg font-semibold text-purple-700 mb-3">Overall Feedback</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{state.finalFeedback.value}</p>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 text-center italic">
              Reviews are made up for learning.
            </p>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-6">
              Generate customer reviews and a rating to see what people think!
            </p>
            <button
              onClick={async () => {
                playSound()
                setIsGenerating(true)
                try {
                  await generateFinalOutput()
                } catch (error) {
                  console.error('Failed to generate final output:', error)
                } finally {
                  setIsGenerating(false)
                }
              }}
              disabled={isGenerating || state.finalGenerated}
              className="bg-purple-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : state.finalGenerated ? "Already Generated" : "Generate Reviews & Rating"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}


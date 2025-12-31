import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaHeart, FaHeadphones, FaPalette } from 'react-icons/fa'
import { useSound } from '../../hooks/useSound'
import ProgressBar from '../../components/priceit/ProgressBar'

export default function MarketStreet() {
  const navigate = useNavigate()
  const playSound = useSound({ volume: 0.2 })

  const handleContinue = () => {
    playSound()
    navigate('/priceit/value')
  }

  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      <ProgressBar />
      <div className="flex flex-col items-center pt-12 px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-52 h-52 rounded-full bg-purple-200 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 w-64 h-64 rounded-full bg-purple-200 opacity-30 blur-3xl" />

      {/* Title area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-purple-600 text-center"
        >
          Market Street
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-2 text-base md:text-lg text-gray-600 text-center max-w-xl"
        >
          See how other products in the market are priced.
        </motion.p>
      </motion.div>

      {/* Comparison cards section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl"
      >
        {/* Card 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3"
        >
          <div className="flex items-center">
            <FaHeart className="text-4xl text-pink-500" />
            <div className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              Example
            </div>
          </div>
          <h3 className="text-lg font-semibold text-purple-700">Custom Sticker Pack</h3>
          <p className="text-sm text-gray-500">Fun stickers for kids to decorate their stuff</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-sm text-gray-500">Typical price</span>
            <span className="text-2xl font-bold text-purple-600">$12.00</span>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3"
        >
          <div className="flex items-center">
            <FaHeadphones className="text-4xl text-blue-500" />
            <div className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              Example
            </div>
          </div>
          <h3 className="text-lg font-semibold text-purple-700">Kids Headphones</h3>
          <p className="text-sm text-gray-500">Colorful headphones designed for children</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-sm text-gray-500">Typical price</span>
            <span className="text-2xl font-bold text-purple-600">$25.00</span>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3"
        >
          <div className="flex items-center">
            <FaPalette className="text-4xl text-pink-500" />
            <div className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              Example
            </div>
          </div>
          <h3 className="text-lg font-semibold text-purple-700">Art Supply Kit</h3>
          <p className="text-sm text-gray-500">Complete set of crayons, markers, and paper</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-sm text-gray-500">Typical price</span>
            <span className="text-2xl font-bold text-purple-600">$18.00</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Your product panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-10 w-full max-w-xl bg-purple-50 border border-purple-100 rounded-3xl p-6 flex flex-col gap-3"
      >
        <h3 className="text-lg font-semibold text-purple-700">Your product price (coming soon)</h3>
        <p className="text-sm text-gray-600">
          Later, this section will compare your chosen price to the market examples above.
        </p>
      </motion.div>

      {/* Continue Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleContinue}
        className="mt-10 bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
      >
        Continue
      </motion.button>
      </div>
    </div>
  )
}


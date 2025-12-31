import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaStar, FaUsers } from 'react-icons/fa'
import { useAppState } from '../context/AppState'
import { useSound } from '../hooks/useSound'

export default function ValueLab() {
  const navigate = useNavigate()
  const { calculatePrice } = useAppState()
  const playSound = useSound({ volume: 0.2 })

  const handleContinue = () => {
    playSound()
    calculatePrice()
    navigate('/celebration')
  }

  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center pt-20 px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-52 h-52 rounded-full bg-purple-200 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 w-64 h-64 rounded-full bg-purple-200 opacity-30 blur-3xl" />

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
          Value Lab
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-2 text-base md:text-lg text-gray-600 text-center max-w-xl"
        >
          Think about why your product is special and who will love it.
        </motion.p>
      </motion.div>

      {/* Value cards row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mt-10 w-full max-w-5xl grid gap-6 md:grid-cols-3"
      >
        {/* Quality Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3"
        >
          <FaStar className="text-3xl text-yellow-500" />
          <h3 className="text-lg font-semibold text-purple-700">Quality</h3>
          <p className="text-sm text-gray-600">
            Is your product made really well and built to last?
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
            <div className="h-3 w-3 rounded-full bg-purple-500"></div>
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
          </div>
        </motion.div>

        {/* Uniqueness Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3"
        >
          <FaStar className="text-3xl text-purple-500" />
          <h3 className="text-lg font-semibold text-purple-700">Uniqueness</h3>
          <p className="text-sm text-gray-600">
            Does your product have something special that makes it different?
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
            <div className="h-3 w-3 rounded-full bg-purple-500"></div>
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
          </div>
        </motion.div>

        {/* Target Audience Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3"
        >
          <FaUsers className="text-3xl text-pink-500" />
          <h3 className="text-lg font-semibold text-purple-700">Target Audience</h3>
          <p className="text-sm text-gray-600">
            Who will love your product and want to buy it?
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
            <div className="h-3 w-3 rounded-full bg-purple-500"></div>
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
          </div>
        </motion.div>
      </motion.div>

      {/* Placeholder value chart box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-10 w-full max-w-3xl bg-purple-50 border border-dashed border-purple-300 rounded-3xl p-6 text-center"
      >
        <h3 className="text-md font-semibold text-purple-700">Future chart area</h3>
        <p className="mt-1 text-sm text-gray-600">
          Later, this space can show a bar chart that compares value and price.
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
        Continue <FaStar className="text-white" />
      </motion.button>
    </div>
  )
}


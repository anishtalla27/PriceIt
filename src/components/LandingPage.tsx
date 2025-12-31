import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-white">
      {/* Decorative Background Blobs */}
      <div className="absolute top-20 left-20 w-40 h-40 bg-purple-400 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-32 right-32 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
      
      {/* Main Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center z-10"
      >
        {/* Title */}
        <h1 className="text-5xl font-bold text-purple-600 text-center">
          💡 PriceIt!
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 text-center mt-2">
          Learn how to price products through play! 🎨
        </p>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/product-studio')}
          className="mt-6 bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg hover:scale-105 transition-transform"
        >
          Start Pricing 🛍️
        </motion.button>
      </motion.div>
    </div>
  )
}

export default LandingPage


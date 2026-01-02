import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaLightbulb, FaPalette, FaShoppingBag } from 'react-icons/fa'
import { useSound } from '../../hooks/useSound'

const LandingPage = () => {
  const navigate = useNavigate()
  const playSound = useSound({ volume: 0.2 })

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-white opacity-0 translate-y-4 animate-[fadeIn_0.4s_ease-out_forwards]">
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
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-5xl font-bold text-purple-600 text-center flex items-center justify-center gap-3"
        >
          <span className="inline-block transition-transform hover:-translate-y-1"><FaLightbulb className="text-yellow-500" /></span>
          PriceIt!
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-lg text-gray-600 text-center mt-2 flex items-center justify-center gap-2"
        >
          Learn how to price products through play! <span className="inline-block transition-transform hover:-translate-y-1"><FaPalette className="text-pink-500" /></span>
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 0.4,
            delay: 0.2,
            scale: {
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut"
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playSound()
            navigate('/priceit/product')
          }}
          className="mt-6 bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
        >
          Start Pricing <span className="inline-block transition-transform hover:-translate-y-1"><FaShoppingBag className="text-white" /></span>
        </motion.button>
      </motion.div>
    </div>
  )
}

export default LandingPage


import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Main Content */}
      <main className="flex-grow relative overflow-hidden">
        {/* Purple Accent Shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-brand-purple-light rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-brand-purple rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-brand-purple-dark rounded-full opacity-10 blur-xl"></div>
        
        {/* Content Container */}
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-8 max-w-4xl"
          >
            {/* Logo Circle */}
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="mx-auto w-32 h-32 bg-gradient-to-br from-brand-purple to-brand-purple-dark rounded-full flex items-center justify-center shadow-2xl"
            >
              <span className="text-white text-6xl font-bold">P</span>
            </motion.div>

            {/* Title */}
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-7xl md:text-8xl font-extrabold text-brand-purple"
              style={{ textShadow: '4px 4px 0px rgba(147, 51, 234, 0.2)' }}
            >
              PriceIt!
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl text-gray-700 font-semibold"
            >
              Learn pricing by building your own product! 🎨
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Create awesome products, calculate costs, explore the market, and discover the perfect price!
            </motion.p>

            {/* Start Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/product-studio')}
                className="btn-primary text-3xl py-6 px-16 mt-4"
              >
                🚀 Start Your Journey!
              </motion.button>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex flex-wrap justify-center gap-4 pt-8"
            >
              {['Design Products', 'Calculate Costs', 'Explore Markets', 'Set Prices'].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="bg-brand-purple-light text-white px-6 py-3 rounded-full font-semibold text-lg shadow-lg"
                >
                  {feature}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default LandingPage


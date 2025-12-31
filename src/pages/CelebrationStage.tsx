import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const CelebrationStage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Celebration Content */}
          <div className="card text-center space-y-8 py-16">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="text-9xl"
            >
              🎉
            </motion.div>

            <h1 className="text-6xl font-bold text-brand-purple mb-4">
              Amazing Job!
            </h1>
            
            <p className="text-3xl text-gray-600 mb-8">
              You've learned how to price a product! 🌟
            </p>

            <div className="space-y-4 max-w-2xl mx-auto">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-brand-purple-light text-white p-4 rounded-2xl text-xl font-semibold"
              >
                ✓ You designed a product
              </motion.div>
              
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-brand-purple-light text-white p-4 rounded-2xl text-xl font-semibold"
              >
                ✓ You calculated costs
              </motion.div>
              
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-brand-purple-light text-white p-4 rounded-2xl text-xl font-semibold"
              >
                ✓ You researched the market
              </motion.div>
              
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="bg-brand-purple-light text-white p-4 rounded-2xl text-xl font-semibold"
              >
                ✓ You found the perfect price!
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="btn-primary mt-12"
            >
              Start Over 🔄
            </motion.button>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  )
}

export default CelebrationStage


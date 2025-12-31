import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ValueLab = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-brand-purple mb-4">
              🧪 Value Lab
            </h1>
            <p className="text-2xl text-gray-600">
              Discover your perfect price!
            </p>
          </div>

          {/* Content Card */}
          <div className="card space-y-6">
            <div className="text-center py-20">
              <p className="text-3xl text-gray-500 mb-8">
                Value calculation coming soon! 🎯
              </p>
              <p className="text-xl text-gray-400">
                This is where you'll set your final price
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t-2 border-brand-purple-light">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/market-street')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-8 rounded-full transition-colors"
              >
                ← Back
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/celebration')}
                className="btn-primary"
              >
                Finish! 🎉
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  )
}

export default ValueLab


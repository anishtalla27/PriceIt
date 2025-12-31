import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const Header = () => {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white shadow-lg border-b-4 border-brand-purple"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-brand-purple rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">P</span>
            </div>
            <h1 className="text-3xl font-bold text-brand-purple">PriceIt!</h1>
          </Link>
          
          <nav className="hidden md:flex space-x-4">
            <Link 
              to="/" 
              className="px-4 py-2 rounded-full hover:bg-brand-purple-light hover:text-white transition-colors font-semibold"
            >
              Home
            </Link>
          </nav>
        </div>
      </div>
    </motion.header>
  )
}

export default Header


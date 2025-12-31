import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaPalette, FaTools, FaHeart, FaStar, FaTrophy } from 'react-icons/fa'
import { useSound } from '../../hooks/useSound'

interface Stage {
  id: string
  name: string
  route: string
  Icon: React.FC<{ className?: string }>
}

const stages: Stage[] = [
  { id: 'product', name: 'Product', route: '/priceit/product', Icon: FaPalette },
  { id: 'cost', name: 'Cost', route: '/priceit/cost', Icon: FaTools },
  { id: 'market', name: 'Market', route: '/priceit/market', Icon: FaHeart },
  { id: 'value', name: 'Value', route: '/priceit/value', Icon: FaStar },
  { id: 'celebrate', name: 'Celebrate', route: '/priceit/celebrate', Icon: FaTrophy },
]

export default function ProgressBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const playSound = useSound({ volume: 0.2 })

  const currentStageIndex = stages.findIndex(
    stage => location.pathname === stage.route
  )

  const currentStage = currentStageIndex >= 0 ? stages[currentStageIndex] : null
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stages.length - 1 
    ? stages[currentStageIndex + 1] 
    : null

  const handleNext = () => {
    if (nextStage) {
      playSound()
      navigate(nextStage.route)
    }
  }

  // Don't show progress bar on landing or celebration pages
  if (location.pathname === '/priceit' || location.pathname === '/priceit/celebrate') {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full bg-white border-b-2 border-purple-200 shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {stages.map((stage, index) => {
              const isCompleted = index < currentStageIndex
              const isCurrent = index === currentStageIndex
              const isUpcoming = index > currentStageIndex

              return (
                <div key={stage.id} className="flex items-center gap-2 flex-shrink-0">
                  {/* Stage Circle */}
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        transition-all duration-300
                        ${isCompleted 
                          ? 'bg-purple-500 text-white' 
                          : isCurrent 
                          ? 'bg-purple-600 text-white scale-110 shadow-lg' 
                          : 'bg-purple-100 text-purple-400'
                        }
                      `}
                      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
                    >
                      <stage.Icon className="text-lg" />
                    </motion.div>
                    <span className={`
                      text-xs font-semibold whitespace-nowrap
                      ${isCurrent ? 'text-purple-600' : isCompleted ? 'text-purple-500' : 'text-gray-400'}
                    `}>
                      {stage.name}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < stages.length - 1 && (
                    <div className={`
                      h-1 w-8 md:w-16 rounded-full transition-all duration-300
                      ${isCompleted ? 'bg-purple-500' : 'bg-purple-100'}
                    `} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Next Button */}
          {nextStage && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md transition-colors flex items-center gap-2 flex-shrink-0"
            >
              Next: {nextStage.name}
              <span>→</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}


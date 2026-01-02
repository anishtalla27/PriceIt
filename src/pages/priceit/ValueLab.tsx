import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import ProgressBar from '../../components/priceit/ProgressBar'
import { useAppState } from '../../context/AppState'
import { useSound } from '../../hooks/useSound'

type Persona = "kids" | "gift" | "hobbyist"

export default function ValueLab() {
  const navigate = useNavigate()
  const playSound = useSound({ volume: 0.2 })
  const { 
    state, 
    updateQuality, 
    updateUniqueness, 
    updateEffort,
    calculateCostBreakdown,
    requestPricingRecommendation,
    getFieldMetadata
  } = useAppState()
  
  // Sync local state with global state
  const [quality, setQuality] = useState<number>(state.quality?.value || 2)
  const [uniqueness, setUniqueness] = useState<number>(state.uniqueness?.value || 2)
  const [effort, setEffort] = useState<number>(state.effort?.value || 2)
  const [persona, setPersona] = useState<Persona>("kids")
  const [isRequestingPrice, setIsRequestingPrice] = useState(false)

  // Sync local state to global state when sliders change
  useEffect(() => {
    if (updateQuality) updateQuality(quality, "user")
  }, [quality, updateQuality])

  useEffect(() => {
    if (updateUniqueness) updateUniqueness(uniqueness, "user")
  }, [uniqueness, updateUniqueness])

  useEffect(() => {
    if (updateEffort) updateEffort(effort, "user")
  }, [effort, updateEffort])

  // Helper functions to get label and note for each slider
  const getQualityLabel = (value: number): string => {
    if (value === 1) return 'Simple'
    if (value === 2) return 'Good'
    return 'Excellent'
  }

  const getQualityNote = (value: number): string => {
    if (value === 1) return 'Might feel basic. Keep price friendly.'
    if (value === 2) return 'Nice quality. A fair price can work.'
    return 'High quality. People may accept higher prices.'
  }

  const getUniquenessLabel = (value: number): string => {
    if (value === 1) return 'Common'
    if (value === 2) return 'Cool'
    return 'One-of-a-kind'
  }

  const getUniquenessNote = (value: number): string => {
    if (value === 1) return 'Lots of similar ideas exist.'
    if (value === 2) return 'Stands out a bit. Add a small value boost.'
    return 'Very unique. You can price with confidence.'
  }

  const getEffortLabel = (value: number): string => {
    if (value === 1) return 'Quick'
    if (value === 2) return 'Takes time'
    return 'A lot of work'
  }

  const getEffortNote = (value: number): string => {
    if (value === 1) return 'Fast to make. Lower prices may fit.'
    if (value === 2) return 'Some effort. Middle prices can fit.'
    return 'Big effort. Higher prices may make sense.'
  }

  // Value summary calculations
  const valueScore = quality + uniqueness + effort
  const getValueLevel = (score: number): "Low" | "Medium" | "High" => {
    if (score <= 4) return "Low"
    if (score <= 7) return "Medium"
    return "High"
  }
  const valueLevel = getValueLevel(valueScore)

  const getValueLevelInterpretation = (level: "Low" | "Medium" | "High"): string => {
    if (level === "Low") return "Your product feels simple right now. A lower price usually fits best."
    if (level === "Medium") return "Your product has solid value. A fair middle price can work."
    return "Your product feels premium. People may accept a higher price."
  }

  const getPersonaTip = (persona: Persona): string => {
    if (persona === "kids") return "Kids usually choose fun first, then price."
    if (persona === "gift") return "Gift buyers may pay more if it looks special and well-packaged."
    return "Hobbyists often pay more for quality and unique details."
  }

  // Pricing style calculations
  const getPricingStyle = (score: number): "Budget Friendly" | "Fair & Balanced" | "Premium" => {
    if (score <= 4) return "Budget Friendly"
    if (score <= 7) return "Fair & Balanced"
    return "Premium"
  }
  const pricingStyle = getPricingStyle(valueScore)

  const getPersonaGuidance = (persona: Persona, style: "Budget Friendly" | "Fair & Balanced" | "Premium"): string => {
    if (persona === "kids") {
      if (style === "Budget Friendly") return "Keep it low and fun, like a quick treat."
      if (style === "Fair & Balanced") return "Make it affordable, but don't underprice your work."
      return "Premium can work if it feels extra fun and special."
    }
    if (persona === "gift") {
      if (style === "Budget Friendly") return "Gift buyers may skip it if it looks too cheap."
      if (style === "Fair & Balanced") return "A clean presentation helps justify a fair price."
      return "Premium works if packaging and story feel impressive."
    }
    // hobbyist
    if (style === "Budget Friendly") return "Hobbyists may doubt the quality if it's too low."
    if (style === "Fair & Balanced") return "Balance is good if your craftsmanship is solid."
    return "Premium fits when details and quality are clearly high."
  }
  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center pt-20 px-4 opacity-0 translate-y-4 animate-[fadeIn_0.4s_ease-out_forwards]">
      <ProgressBar />
      
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-52 h-52 rounded-full bg-purple-200 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 w-64 h-64 rounded-full bg-purple-200 opacity-30 blur-3xl" />

      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center z-10"
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
          Let's figure out what makes your product special.
        </motion.p>
      </motion.div>

      {/* AI buddy intro (static) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 bg-gradient-to-br from-purple-50 to-white ring-1 ring-purple-100 border border-purple-100 rounded-3xl p-6 max-w-xl text-center text-purple-700 text-sm shadow-sm z-10"
      >
        <p>
          People don't just buy things. They buy quality, ideas, and feelings.
        </p>
      </motion.div>

      {/* Section placeholders */}
      <div className="w-full max-w-5xl z-10">
        {/* A) Value Sliders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 w-full max-w-5xl bg-white rounded-3xl shadow-md border border-purple-100 p-6 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold text-purple-700 mb-1">Value Sliders</h3>
          <p className="text-sm text-gray-600 mb-6">Move the sliders to describe your product.</p>

          <div className="flex flex-col gap-6">
            {/* Quality Slider */}
            <div className={`rounded-2xl border border-purple-100 p-4 ${quality === 3 ? 'ring-2 ring-purple-200' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl"><span className="inline-block transition-transform hover:-translate-y-1">🔧</span></span>
                  <span className="text-lg font-semibold text-purple-700">Quality</span>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
                  {getQualityLabel(quality)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">How good is your product?</p>
              <input
                type="range"
                min={1}
                max={3}
                step={1}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full mt-3 accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Simple</span>
                <span>Excellent</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{getQualityNote(quality)}</p>
            </div>

            {/* Uniqueness Slider */}
            <div className={`rounded-2xl border border-purple-100 p-4 ${uniqueness === 3 ? 'ring-2 ring-purple-200' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl"><span className="inline-block transition-transform hover:-translate-y-1">✨</span></span>
                  <span className="text-lg font-semibold text-purple-700">Uniqueness</span>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
                  {getUniquenessLabel(uniqueness)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">How special is your idea?</p>
              <input
                type="range"
                min={1}
                max={3}
                step={1}
                value={uniqueness}
                onChange={(e) => setUniqueness(Number(e.target.value))}
                className="w-full mt-3 accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Common</span>
                <span>One-of-a-kind</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{getUniquenessNote(uniqueness)}</p>
            </div>

            {/* Effort Slider */}
            <div className={`rounded-2xl border border-purple-100 p-4 ${effort === 3 ? 'ring-2 ring-purple-200' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl"><span className="inline-block transition-transform hover:-translate-y-1">⭐</span></span>
                  <span className="text-lg font-semibold text-purple-700">Effort</span>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
                  {getEffortLabel(effort)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">How much work does it take to make?</p>
              <input
                type="range"
                min={1}
                max={3}
                step={1}
                value={effort}
                onChange={(e) => setEffort(Number(e.target.value))}
                className="w-full mt-3 accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Quick</span>
                <span>A lot of work</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{getEffortNote(effort)}</p>
            </div>
          </div>
        </motion.div>

        {/* B) Who Is This For? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-8 w-full max-w-5xl bg-white rounded-3xl shadow-md border border-purple-100 p-6 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold text-purple-700 mb-1">Who Is This For?</h3>
          <p className="text-sm text-gray-600 mb-4">Pick the kind of customer you want to impress.</p>
          
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            {/* Kids Persona */}
            <div
              onClick={() => setPersona("kids")}
              className={`bg-white rounded-3xl shadow-md border border-purple-100 p-6 cursor-pointer transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg flex flex-col gap-2 ${
                persona === "kids" ? "ring-2 ring-purple-300" : ""
              }`}
            >
              <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">🎒</span></span>
              <h4 className="text-lg font-semibold text-purple-700">Kids</h4>
              <p className="text-sm text-gray-600">Fun + affordable</p>
              <p className="text-xs text-gray-500">Keep it simple and exciting.</p>
            </div>

            {/* Gift Buyer Persona */}
            <div
              onClick={() => setPersona("gift")}
              className={`bg-white rounded-3xl shadow-md border border-purple-100 p-6 cursor-pointer transition-transform hover:scale-105 flex flex-col gap-2 ${
                persona === "gift" ? "ring-2 ring-purple-300" : ""
              }`}
            >
              <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">🎁</span></span>
              <h4 className="text-lg font-semibold text-purple-700">Gift Buyer</h4>
              <p className="text-sm text-gray-600">Looks special + story</p>
              <p className="text-xs text-gray-500">Packaging and presentation matter.</p>
            </div>

            {/* Hobbyist Persona */}
            <div
              onClick={() => setPersona("hobbyist")}
              className={`bg-white rounded-3xl shadow-md border border-purple-100 p-6 cursor-pointer transition-transform hover:scale-105 flex flex-col gap-2 ${
                persona === "hobbyist" ? "ring-2 ring-purple-300" : ""
              }`}
            >
              <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">🧑‍🎨</span></span>
              <h4 className="text-lg font-semibold text-purple-700">Hobbyist</h4>
              <p className="text-sm text-gray-600">Quality + uniqueness</p>
              <p className="text-xs text-gray-500">Details and craftsmanship matter.</p>
            </div>
          </div>
        </motion.div>

        {/* C) Value Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8 w-full max-w-5xl bg-white rounded-3xl shadow-md border border-purple-100 p-6 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold text-purple-700 mb-4">Value Summary</h3>
          
          <div className="mb-4">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
              {valueLevel}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700">
              {getValueLevelInterpretation(valueLevel)}
            </p>
            
            <p className="text-sm text-gray-700">
              {getPersonaTip(persona)}
            </p>
            
            <p className="text-sm text-gray-700">
              Nice choices. You're building a real product story!
            </p>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            Tip: Match your price to your value and your customer.
          </p>
        </motion.div>

        {/* D) What This Means for Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="mt-8 w-full max-w-5xl bg-white rounded-3xl shadow-md border border-purple-100 p-6 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold text-purple-700 mb-1">What This Means for Pricing</h3>
          <p className="text-sm text-gray-600 mb-4">Your price should match your value story.</p>

          <div className="flex flex-col gap-4">
            {/* Your value level */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Your value level:</p>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
                {valueLevel}
              </span>
            </div>

            {/* Pricing style */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Pricing style:</p>
              <span className="text-sm font-semibold text-purple-700">
                {pricingStyle}
              </span>
            </div>

            {/* Persona-specific guidance */}
            <div>
              <p className="text-sm text-gray-700">
                {getPersonaGuidance(persona, pricingStyle)}
              </p>
            </div>

            {/* Quick tip callout */}
            <div className="mt-4 bg-gradient-to-br from-purple-50 to-white ring-1 ring-purple-100 border border-purple-100 rounded-2xl p-4 text-sm text-purple-700">
              Quick Tip: If you raise price, raise quality or presentation too.
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pricing Recommendation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.65 }}
        className="mt-10 w-full max-w-5xl bg-gradient-to-br from-purple-50 to-white ring-1 ring-purple-100 rounded-3xl shadow-md border border-purple-100 p-6 z-10"
      >
        <h3 className="text-lg font-semibold text-purple-700 mb-4">Price Suggestion</h3>
        
        {state.suggestedPrice.value > 0 ? (
          <div className="space-y-4">
            {/* Suggested Price Display */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Suggested Price</p>
              <p className="text-4xl font-bold text-purple-600">
                ${state.suggestedPrice.value.toFixed(2)}
              </p>
              {state.priceBreakdown && (
                <p className="text-xs text-gray-500 mt-1">
                  Cost per product: ${state.priceBreakdown.totalCostPerProduct.toFixed(2)}
                </p>
              )}
            </div>

            {/* Price Position Badge */}
            {state.pricePosition?.value && (
              <div className="flex justify-center">
                <span className="text-xs font-semibold px-4 py-2 rounded-full bg-purple-100 text-purple-700 capitalize">
                  {state.pricePosition.value}
                </span>
              </div>
            )}

            {/* Pricing Explanation */}
            {state.pricingExplanation?.value && (
              <div className="bg-white rounded-2xl p-4 border border-purple-100">
                <p className="text-sm text-gray-700">{state.pricingExplanation.value}</p>
              </div>
            )}

            {/* AI Indicator */}
            {state.suggestedPrice.metadata.lastUpdatedBy === "ai" && (
              <div className="flex items-center justify-center gap-1 text-xs text-purple-600">
                <span>✨</span>
                <span>Filled by AI</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-600 mb-4">
              Tap the button and I'll suggest a price.
            </p>
            <button
              onClick={async () => {
                playSound()
                setIsRequestingPrice(true)
                try {
                  await requestPricingRecommendation()
                } catch (error) {
                  console.error('Failed to get pricing recommendation:', error)
                } finally {
                  setIsRequestingPrice(false)
                }
              }}
              disabled={isRequestingPrice}
              className="bg-purple-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isRequestingPrice ? "Thinking..." : "Get a Price Suggestion"}
            </button>
          </div>
        )}
      </motion.div>

      {/* Navigation button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        onClick={() => navigate('/priceit/market')}
        className="mt-10 bg-purple-500 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
      >
        Continue to Market Street →
      </motion.button>
    </div>
  )
}

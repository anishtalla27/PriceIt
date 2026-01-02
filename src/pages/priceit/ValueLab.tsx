import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import ProgressBar from '../../components/priceit/ProgressBar'
import { useAppState } from '../../context/AppState'
import { useSound } from '../../hooks/useSound'

type Persona = "kids" | "gift" | "hobbyist" | "parents" | "teens" | "teachers" | "collectors" | "other"

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
  
  // Sync local state with global state (default to 3 - middle)
  const [quality, setQuality] = useState<number>(state.quality?.value || 3)
  const [uniqueness, setUniqueness] = useState<number>(state.uniqueness?.value || 3)
  const [effort, setEffort] = useState<number>(state.effort?.value || 3)
  const [persona, setPersona] = useState<Persona>("kids")
  const [customPersona, setCustomPersona] = useState<string>("")
  const [isRequestingPrice, setIsRequestingPrice] = useState(false)

  // Helper functions to get label for each slider (5 levels)
  const getQualityLabel = (value: number): string => {
    if (value === 1) return 'Basic'
    if (value === 2) return 'Decent'
    if (value === 3) return 'Good'
    if (value === 4) return 'Great'
    return 'Pro'
  }

  const getUniquenessLabel = (value: number): string => {
    if (value === 1) return 'Common'
    if (value === 2) return 'Slightly Different'
    if (value === 3) return 'Cool'
    if (value === 4) return 'Very Unique'
    return 'One-of-a-kind'
  }

  const getEffortLabel = (value: number): string => {
    if (value === 1) return 'Super Quick'
    if (value === 2) return 'Quick'
    if (value === 3) return 'Some Time'
    if (value === 4) return 'Lots of Time'
    return 'Serious Work'
  }

  // Helper functions to get guidance bullets for each slider
  const getQualityGuidance = (value: number): string[] => {
    if (value === 1) return ["May break easily", "Made with simple materials"]
    if (value === 2) return ["Works fine", "Not super durable"]
    if (value === 3) return ["Feels solid", "Most people would be happy"]
    if (value === 4) return ["Strong + neat", "Looks well-made"]
    return ["High-end", "Looks store-quality"]
  }

  const getUniquenessGuidance = (value: number): string[] => {
    if (value === 1) return ["Many people sell this", "Not much different"]
    if (value === 2) return ["Small twist", "A few extra features"]
    if (value === 3) return ["Fun idea", "Stands out a bit"]
    if (value === 4) return ["Rare concept", "Hard to find elsewhere"]
    return ["Totally original", "People remember it"]
  }

  const getEffortGuidance = (value: number): string[] => {
    if (value === 1) return ["1–5 minutes", "Easy steps"]
    if (value === 2) return ["5–10 minutes", "A few steps"]
    if (value === 3) return ["10–20 minutes", "Some careful work"]
    if (value === 4) return ["20–45 minutes", "Many steps + focus"]
    return ["45+ minutes", "Lots of careful work"]
  }

  // Helper functions to get interpretation note for each slider
  const getQualityNote = (value: number): string => {
    if (value === 1) return 'Might feel basic. Keep price friendly.'
    if (value === 2) return 'Decent quality. A fair price can work.'
    if (value === 3) return 'Good quality. Most people would be happy.'
    if (value === 4) return 'Great quality. You can charge more.'
    return 'Pro quality. People may accept premium prices.'
  }

  const getUniquenessNote = (value: number): string => {
    if (value === 1) return 'Lots of similar ideas exist.'
    if (value === 2) return 'Has a small twist. Add a small value boost.'
    if (value === 3) return 'Stands out a bit. A fair price can work.'
    if (value === 4) return 'Very unique. You can price with confidence.'
    return 'One-of-a-kind. People remember it and may pay more.'
  }

  const getEffortNote = (value: number): string => {
    if (value === 1) return 'Super quick to make. Lower prices may fit.'
    if (value === 2) return 'Quick to make. Lower-middle prices can fit.'
    if (value === 3) return 'Some effort. Middle prices can fit.'
    if (value === 4) return 'Lots of effort. Higher prices may make sense.'
    return 'Serious work. Higher prices make sense.'
  }

  // Value summary calculations (3-15 range)
  const valueScore = quality + uniqueness + effort
  const getValueLevel = (score: number): "Low" | "Medium" | "High" => {
    if (score <= 6) return "Low"
    if (score <= 11) return "Medium"
    return "High"
  }
  const valueLevel = getValueLevel(valueScore)

  const getValueLevelInterpretation = (level: "Low" | "Medium" | "High"): string => {
    if (level === "Low") return "Your product feels simple right now. A lower price usually fits best."
    if (level === "Medium") return "Your product has solid value. A fair middle price can work."
    return "Your product feels premium. People may accept a higher price."
  }

  const getActionableSuggestion = (level: "Low" | "Medium" | "High"): string => {
    if (level === "Low") return "Try improving quality OR packaging to justify a higher price."
    if (level === "Medium") return "Pick one thing to boost: uniqueness or presentation."
    return "Make sure your price matches the premium feel."
  }

  const getPersonaTip = (persona: Persona, customPersona?: string): string => {
    if (persona === "kids") return "Kids usually choose fun first, then price."
    if (persona === "gift") return "Gift buyers may pay more if it looks special and well-packaged."
    if (persona === "hobbyist") return "Hobbyists often pay more for quality and unique details."
    if (persona === "parents") return "Parents look for value and things that last."
    if (persona === "teens") return "Teens care about what's trendy and looks cool."
    if (persona === "teachers") return "Teachers want things that are useful and easy to use."
    if (persona === "collectors") return "Collectors value rare items with special details."
    if (persona === "other") {
      if (customPersona && customPersona.trim()) {
        return `For ${customPersona}, think about what they care about most: price, looks, or quality.`
      }
      return "For your customer, think about what they care about most."
    }
    return "Think about what your customer cares about most."
  }

  // Pricing style calculations (updated for 3-15 range)
  const getPricingStyle = (score: number): "Budget Friendly" | "Fair & Balanced" | "Premium" => {
    if (score <= 6) return "Budget Friendly"
    if (score <= 11) return "Fair & Balanced"
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
    if (persona === "hobbyist") {
      if (style === "Budget Friendly") return "Hobbyists may doubt the quality if it's too low."
      if (style === "Fair & Balanced") return "Balance is good if your craftsmanship is solid."
      return "Premium fits when details and quality are clearly high."
    }
    if (persona === "parents") {
      if (style === "Budget Friendly") return "Parents appreciate good value at lower prices."
      if (style === "Fair & Balanced") return "Fair prices work well if quality is clear."
      return "Premium can work if it's built to last."
    }
    if (persona === "teens") {
      if (style === "Budget Friendly") return "Teens may skip if it looks too basic."
      if (style === "Fair & Balanced") return "Fair prices work if it looks trendy."
      return "Premium can work if it's super cool and unique."
    }
    if (persona === "teachers") {
      if (style === "Budget Friendly") return "Teachers appreciate affordable, useful items."
      if (style === "Fair & Balanced") return "Fair prices work if it's clearly helpful."
      return "Premium can work if it saves time or solves a big problem."
    }
    if (persona === "collectors") {
      if (style === "Budget Friendly") return "Collectors may doubt rarity if price is too low."
      if (style === "Fair & Balanced") return "Fair prices work if details are impressive."
      return "Premium fits when items are truly unique and detailed."
    }
    // other
    if (style === "Budget Friendly") return "Keep price low but make sure quality is still good."
    if (style === "Fair & Balanced") return "A fair price works when value is clear."
    return "Premium can work if it matches what your customer values most."
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
        className="text-center z-10 mt-[40px]"
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
              
              {/* How to choose guidance */}
              <div className="mt-2 mb-3">
                <p className="text-xs font-semibold text-purple-600 mb-1">How to choose?</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {getQualityGuidance(quality).map((bullet, idx) => (
                    <li key={idx}>• {bullet}</li>
                  ))}
                </ul>
              </div>

              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={quality}
                onChange={(e) => {
                  const newValue = Number(e.target.value)
                  setQuality(newValue)
                  if (updateQuality) updateQuality(newValue, "user")
                }}
                className="w-full mt-3 accent-purple-500"
              />
              {/* 5 tick labels */}
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Basic</span>
                <span>Decent</span>
                <span>Good</span>
                <span>Great</span>
                <span>Pro</span>
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
              
              {/* How to choose guidance */}
              <div className="mt-2 mb-3">
                <p className="text-xs font-semibold text-purple-600 mb-1">How to choose?</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {getUniquenessGuidance(uniqueness).map((bullet, idx) => (
                    <li key={idx}>• {bullet}</li>
                  ))}
                </ul>
              </div>

              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={uniqueness}
                onChange={(e) => {
                  const newValue = Number(e.target.value)
                  setUniqueness(newValue)
                  if (updateUniqueness) updateUniqueness(newValue, "user")
                }}
                className="w-full mt-3 accent-purple-500"
              />
              {/* 5 tick labels */}
              <div className="flex justify-between text-[10px] text-gray-500 mt-1 flex-wrap gap-1">
                <span className="whitespace-nowrap">Common</span>
                <span className="whitespace-nowrap">Slightly Different</span>
                <span className="whitespace-nowrap">Cool</span>
                <span className="whitespace-nowrap">Very Unique</span>
                <span className="whitespace-nowrap">One-of-a-kind</span>
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
              
              {/* How to choose guidance */}
              <div className="mt-2 mb-3">
                <p className="text-xs font-semibold text-purple-600 mb-1">How to choose?</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {getEffortGuidance(effort).map((bullet, idx) => (
                    <li key={idx}>• {bullet}</li>
                  ))}
                </ul>
              </div>

              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={effort}
                onChange={(e) => {
                  const newValue = Number(e.target.value)
                  setEffort(newValue)
                  if (updateEffort) updateEffort(newValue, "user")
                }}
                className="w-full mt-3 accent-purple-500"
              />
              {/* 5 tick labels */}
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Super Quick</span>
                <span>Quick</span>
                <span>Some Time</span>
                <span>Lots of Time</span>
                <span>Serious Work</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{getEffortNote(effort)}</p>
            </div>
          </div>

          {/* "Not sure?" helper */}
          <div className="mt-6 bg-purple-50 border border-purple-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-purple-700 mb-1">Not sure what to pick?</p>
            <p className="text-xs text-gray-600">Start in the middle (3). You can adjust later after you test it.</p>
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
          
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              className={`bg-white rounded-3xl shadow-md border border-purple-100 p-6 cursor-pointer transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg flex flex-col gap-2 ${
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
              className={`bg-white rounded-3xl shadow-md border border-purple-100 p-6 cursor-pointer transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg flex flex-col gap-2 ${
                persona === "hobbyist" ? "ring-2 ring-purple-300" : ""
              }`}
            >
              <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">🧑‍🎨</span></span>
              <h4 className="text-lg font-semibold text-purple-700">Hobbyist</h4>
              <p className="text-sm text-gray-600">Quality + uniqueness</p>
              <p className="text-xs text-gray-500">Details and craftsmanship matter.</p>
            </div>

            {/* Parents Persona */}
            <div
              onClick={() => setPersona("parents")}
              className={`bg-white rounded-3xl shadow-md border border-purple-100 p-6 cursor-pointer transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg flex flex-col gap-2 ${
                persona === "parents" ? "ring-2 ring-purple-300" : ""
              }`}
            >
              <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">🧑‍👧‍👦</span></span>
              <h4 className="text-lg font-semibold text-purple-700">Parents</h4>
              <p className="text-sm text-gray-600">Useful + worth it</p>
              <p className="text-xs text-gray-500">Parents like quality that lasts.</p>
            </div>

            {/* Teens Persona */}
            <div
              onClick={() => setPersona("teens")}
              className={`bg-white rounded-3xl shadow-md border border-purple-100 p-6 cursor-pointer transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg flex flex-col gap-2 ${
                persona === "teens" ? "ring-2 ring-purple-300" : ""
              }`}
            >
              <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">📱</span></span>
              <h4 className="text-lg font-semibold text-purple-700">Teens</h4>
              <p className="text-sm text-gray-600">Trendy + fun</p>
              <p className="text-xs text-gray-500">Looks and vibe matter a lot.</p>
            </div>

            {/* Teachers Persona */}
            <div
              onClick={() => setPersona("teachers")}
              className={`bg-white rounded-3xl shadow-md border border-purple-100 p-6 cursor-pointer transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg flex flex-col gap-2 ${
                persona === "teachers" ? "ring-2 ring-purple-300" : ""
              }`}
            >
              <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">🍎</span></span>
              <h4 className="text-lg font-semibold text-purple-700">Teachers</h4>
              <p className="text-sm text-gray-600">Helpful + simple</p>
              <p className="text-xs text-gray-500">Make it clear and easy to use.</p>
            </div>

            {/* Collectors Persona */}
            <div
              onClick={() => setPersona("collectors")}
              className={`bg-white rounded-3xl shadow-md border border-purple-100 p-6 cursor-pointer transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg flex flex-col gap-2 ${
                persona === "collectors" ? "ring-2 ring-purple-300" : ""
              }`}
            >
              <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">🧾</span></span>
              <h4 className="text-lg font-semibold text-purple-700">Collectors</h4>
              <p className="text-sm text-gray-600">Rare + detailed</p>
              <p className="text-xs text-gray-500">Details can justify higher prices.</p>
            </div>

            {/* Other Persona */}
            <div
              onClick={() => setPersona("other")}
              className={`bg-white rounded-3xl shadow-md border border-purple-100 p-6 cursor-pointer transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg flex flex-col gap-2 ${
                persona === "other" ? "ring-2 ring-purple-300" : ""
              }`}
            >
              <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">✍️</span></span>
              <h4 className="text-lg font-semibold text-purple-700">Other</h4>
              <p className="text-sm text-gray-600">Make your own</p>
              <p className="text-xs text-gray-500">Type who your customer is.</p>
            </div>
          </div>

          {/* Custom Persona Input (shown when "other" is selected) */}
          {persona === "other" && (
            <div className="mt-6">
              <label htmlFor="customPersona" className="block text-sm font-semibold text-purple-700 mb-2">
                Describe your target customer
              </label>
              <input
                id="customPersona"
                type="text"
                value={customPersona}
                onChange={(e) => setCustomPersona(e.target.value)}
                placeholder="Example: 'college students who like cozy rooms'"
                className="w-full px-4 py-2 border border-purple-300 rounded-lg text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
              {!customPersona.trim() && (
                <p className="text-sm text-purple-600 mt-2">
                  Add a short description so I know who it's for.
                </p>
              )}
            </div>
          )}
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
              {getPersonaTip(persona, customPersona)}
            </p>
            
            <p className="text-sm font-semibold text-purple-700">
              {getActionableSuggestion(valueLevel)}
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

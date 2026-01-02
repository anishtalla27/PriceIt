import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ProgressBar from '../../components/priceit/ProgressBar'

type Competitor = {
  id: string
  shopName: string
  productName: string
  price: number
  quality: "low" | "medium" | "high"
  audience?: "kids" | "gift" | "hobbyist" | "parents" | "general"
  packagingQuality?: "basic" | "nice" | "premium"
  reason?: string
  materialsNote?: string
  shippingDays?: number
  rating?: number // optional, 0–5
}

type CompetitorFormState = {
  shopName: string
  productName: string
  price: string
  quality: "low" | "medium" | "high"
  audience: "" | Competitor["audience"]
  packagingQuality: "" | Competitor["packagingQuality"]
  reason: string
  materialsNote: string
  shippingDays: string
  rating: string
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const createBlankForm = (): CompetitorFormState => ({
  shopName: "",
  productName: "",
  price: "",
  quality: "medium",
  audience: "",
  packagingQuality: "",
  reason: "",
  materialsNote: "",
  shippingDays: "",
  rating: "",
})

// TODO: replace/extend competitors using AI based on userProduct data
const initialCompetitors: Competitor[] = [
  {
    id: "c1",
    shopName: "Crafty Corner",
    productName: "Handmade Craft Kit",
    price: 15.99,
    quality: "medium",
    reason: "Good quality at a fair price for crafty kids.",
    audience: "kids",
    packagingQuality: "nice",
    shippingDays: 5,
    rating: 4.2
  },
  {
    id: "c2",
    shopName: "Budget Barn",
    productName: "Basic Craft Supplies",
    price: 8.50,
    quality: "low",
    reason: "Cheapest option, but materials might not last as long.",
    packagingQuality: "basic",
    shippingDays: 7,
    rating: 3.5
  },
  {
    id: "c3",
    shopName: "Premium Picks",
    productName: "Deluxe Craft Collection",
    price: 29.99,
    quality: "high",
    reason: "Top quality materials and beautiful packaging.",
    audience: "gift",
    packagingQuality: "premium",
    shippingDays: 2,
    rating: 4.8
  }
]

export default function MarketStreet() {
  const [competitors, setCompetitors] = useState<Competitor[]>(initialCompetitors)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formState, setFormState] = useState<CompetitorFormState>(createBlankForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [removeWarning, setRemoveWarning] = useState<string | null>(null)

  // Compute competitor stats
  const competitorStats = useMemo(() => {
    const prices = competitors.map(c => c.price).filter(isFinite)
    if (prices.length === 0) {
      return { minPrice: 0, maxPrice: 50, avgPrice: 10 }
    }
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    return { minPrice, maxPrice, avgPrice }
  }, [competitors])

  // Initialize priceGuess with average price (only on first render)
  const [priceGuess, setPriceGuess] = useState<number>(() => {
    return Math.round(competitorStats.avgPrice)
  })

  // Placeholder userProduct object (temporary until we wire global state later)
  const userProduct = {
    productName: "",
    targetCustomer: "",
    suggestedPrice: undefined as number | undefined,
    totalCostPerProduct: undefined as number | undefined,
  }

  // Check if we have enough info to proceed
  const hasEnoughInfo = (): boolean => {
    const productNameOk = userProduct.productName.trim().length > 0
    const hasSomeCost = 
      (userProduct.totalCostPerProduct !== undefined && userProduct.totalCostPerProduct > 0) ||
      (userProduct.suggestedPrice !== undefined && userProduct.suggestedPrice > 0)
    return productNameOk && hasSomeCost
  }

  // Get quality emoji
  const getQualityEmoji = (quality: "low" | "medium" | "high"): string => {
    switch (quality) {
      case "low": return "🏷️"
      case "medium": return "🛍️"
      case "high": return "💎"
    }
  }

  // Get quality badge text
  const getQualityBadge = (quality: "low" | "medium" | "high"): string => {
    switch (quality) {
      case "low": return "Low"
      case "medium": return "Medium"
      case "high": return "High"
    }
  }

  // Open form for adding
  const handleAddClick = () => {
    setFormState(createBlankForm())
    setEditingId(null)
    setIsFormOpen(true)
    setErrors({})
    setRemoveWarning(null)
  }

  // Open form for editing
  const handleEditClick = (competitor: Competitor) => {
    setFormState({
      shopName: competitor.shopName,
      productName: competitor.productName,
      price: competitor.price.toString(),
      quality: competitor.quality,
      audience: competitor.audience || "",
      packagingQuality: competitor.packagingQuality || "",
      reason: competitor.reason || "",
      materialsNote: competitor.materialsNote || "",
      shippingDays: competitor.shippingDays?.toString() || "",
      rating: competitor.rating?.toString() || "",
    })
    setEditingId(competitor.id)
    setIsFormOpen(true)
    setErrors({})
    setRemoveWarning(null)
  }

  // Handle remove
  const handleRemoveClick = (id: string) => {
    if (competitors.length <= 1) {
      setRemoveWarning("Keep at least one competitor on the street.")
      setTimeout(() => setRemoveWarning(null), 3000)
      return
    }
    setCompetitors(competitors.filter(c => c.id !== id))
    setRemoveWarning(null)
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formState.shopName.trim()) {
      newErrors.shopName = "Shop name is required"
    }

    if (!formState.productName.trim()) {
      newErrors.productName = "Product name is required"
    }

    const priceNum = parseFloat(formState.price)
    if (isNaN(priceNum) || priceNum < 0) {
      newErrors.price = "Price must be a number greater than or equal to 0"
    }

    if (formState.shippingDays) {
      const shippingNum = parseFloat(formState.shippingDays)
      if (isNaN(shippingNum) || shippingNum < 0) {
        newErrors.shippingDays = "Shipping days must be a number greater than or equal to 0"
      }
    }

    if (formState.rating) {
      const ratingNum = parseFloat(formState.rating)
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        newErrors.rating = "Rating must be a number between 0 and 5"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submit
  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const priceNum = Math.max(0, parseFloat(formState.price))
    const shippingDaysNum = formState.shippingDays ? Math.max(0, parseFloat(formState.shippingDays)) : undefined
    const ratingNum = formState.rating ? Math.max(0, Math.min(5, parseFloat(formState.rating))) : undefined

    const competitorData: Competitor = {
      id: editingId || makeId(),
      shopName: formState.shopName.trim(),
      productName: formState.productName.trim(),
      price: priceNum,
      quality: formState.quality,
      ...(formState.audience && { audience: formState.audience as Competitor["audience"] }),
      ...(formState.packagingQuality && { packagingQuality: formState.packagingQuality as Competitor["packagingQuality"] }),
      ...(formState.reason.trim() && { reason: formState.reason.trim() }),
      ...(formState.materialsNote.trim() && { materialsNote: formState.materialsNote.trim() }),
      ...(shippingDaysNum !== undefined && { shippingDays: shippingDaysNum }),
      ...(ratingNum !== undefined && { rating: ratingNum }),
    }

    if (editingId) {
      setCompetitors(competitors.map(c => c.id === editingId ? competitorData : c))
    } else {
      setCompetitors([...competitors, competitorData])
    }

    setIsFormOpen(false)
    setEditingId(null)
    setFormState(createBlankForm())
    setErrors({})
    setRemoveWarning(null)
  }

  // Handle cancel
  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormState(createBlankForm())
    setErrors({})
    setRemoveWarning(null)
  }

  // Compute reaction based on price
  const getPriceReaction = () => {
    const { minPrice, maxPrice } = competitorStats
    const cheapThreshold = minPrice * 0.8
    const expensiveThreshold = maxPrice * 1.2

    if (priceGuess < cheapThreshold) {
      return {
        headline: "People might think it's too cheap 😬",
        helper: "If it's super low, some people may think it won't last."
      }
    } else if (priceGuess > expensiveThreshold) {
      return {
        headline: "Might feel too expensive 😕",
        helper: "Higher prices usually need better quality or nicer packaging."
      }
    } else {
      return {
        headline: "Seems fair 🙂",
        helper: "This price fits well with what other shops are charging."
      }
    }
  }

  // Gating UI when not enough info
  if (!hasEnoughInfo()) {
    return (
      <div className="min-h-screen bg-white relative flex flex-col items-center pt-20 px-4 opacity-0 translate-y-4 animate-[fadeIn_0.4s_ease-out_forwards]">
        <ProgressBar />
        
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-52 h-52 rounded-full bg-purple-200 opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 w-64 h-64 rounded-full bg-purple-200 opacity-30 blur-3xl" />

        {/* Title area */}
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
            Market Street
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-2 text-base md:text-lg text-gray-600 text-center max-w-xl"
          >
            Walk down the street and see how other shops price similar stuff!
          </motion.p>
        </motion.div>

        {/* Gating message card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-10 w-full max-w-xl bg-white rounded-3xl shadow-md border border-purple-100 p-8 text-center z-10 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
        >
          <h2 className="text-2xl font-bold text-purple-700 mb-4">
            I need a little more info first.
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Go back and add your product name and costs, then come back here.
          </p>
          <Link
            to="/priceit/product"
            className="inline-block bg-purple-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
          >
            Go Back
          </Link>
        </motion.div>
      </div>
    )
  }

  const reaction = getPriceReaction()
  const sliderMax = Math.max(50, Math.ceil(competitorStats.maxPrice * 1.5))

  // Skeleton UI when enough info
  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center pt-20 px-4">
      <ProgressBar />
      
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-52 h-52 rounded-full bg-purple-200 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 w-64 h-64 rounded-full bg-purple-200 opacity-30 blur-3xl" />

      {/* Title area */}
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
          Market Street
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-2 text-base md:text-lg text-gray-600 text-center max-w-xl"
        >
          Walk down the street and see how other shops price similar stuff!
        </motion.p>
      </motion.div>

      {/* Speech bubble card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-10 w-full max-w-2xl bg-gradient-to-br from-purple-50 to-white ring-1 ring-purple-100 border border-purple-200 rounded-3xl p-6 shadow-sm z-10"
      >
        <p className="text-xl text-purple-700 font-medium text-center">
          Different shops can charge different prices. Let's explore why!
        </p>
      </motion.div>

      {/* Competing Shops Section */}
      <div className="mt-10 w-full max-w-5xl z-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-purple-600">Competing Shops</h2>
          <p className="text-lg text-gray-600 mt-2">
            These shops sell similar products with different prices.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
          {competitors.map((competitor, index) => (
            <motion.div
              key={competitor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              {/* Top row: emoji and quality badge */}
              <div className="flex items-center">
                <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">{getQualityEmoji(competitor.quality)}</span></span>
                <div className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                  {getQualityBadge(competitor.quality)}
                </div>
              </div>

              {/* Shop name */}
              <h3 className="text-lg font-semibold text-purple-700">
                {competitor.shopName}
              </h3>

              {/* Product name */}
              <p className="text-sm text-gray-600">
                {competitor.productName}
              </p>

              {/* Price row */}
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-sm text-gray-500">Typical price</span>
                <span className="text-2xl font-bold text-purple-600">
                  ${competitor.price.toFixed(2)}
                </span>
              </div>

              {/* Reason */}
              {competitor.reason && (
                <p className="text-sm text-gray-600">
                  {competitor.reason}
                </p>
              )}

              {/* Optional tags row */}
              {(competitor.audience || competitor.packagingQuality || competitor.shippingDays || competitor.rating) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {competitor.audience && (
                    <span className="text-xs px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
                      Audience: {competitor.audience.charAt(0).toUpperCase() + competitor.audience.slice(1)}
                    </span>
                  )}
                  {competitor.packagingQuality && (
                    <span className="text-xs px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
                      Packaging: {competitor.packagingQuality.charAt(0).toUpperCase() + competitor.packagingQuality.slice(1)}
                    </span>
                  )}
                  {competitor.shippingDays && (
                    <span className="text-xs px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
                      Ships: {competitor.shippingDays} days
                    </span>
                  )}
                  {competitor.rating && (
                    <span className="text-xs px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
                      Rating: {competitor.rating.toFixed(1)}/5
                    </span>
                  )}
                </div>
              )}

              {/* Edit/Remove buttons */}
              <div className="flex items-center justify-end gap-4 mt-2 pt-3 border-t border-purple-100">
                <button
                  onClick={() => handleEditClick(competitor)}
                  className="text-sm font-semibold text-purple-600 hover:underline transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveClick(competitor.id)}
                  className="text-sm font-semibold text-purple-600 hover:underline transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Remove warning */}
        {removeWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <p className="text-sm text-purple-600 font-semibold">{removeWarning}</p>
          </motion.div>
        )}

        {/* Add Competitor button */}
        <div className="mt-6 text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddClick}
            className="bg-purple-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
          >
            + Add a Competitor
          </motion.button>
          <p className="text-sm text-gray-500 mt-2">
            Add competitors you found online or in stores.
          </p>
        </div>

        {/* Form Panel */}
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full max-w-5xl bg-white rounded-3xl shadow-md border border-purple-100 p-6 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <h3 className="text-2xl font-bold text-purple-700 mb-6">
              {editingId ? "Edit Competitor" : "Add a Competitor"}
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Required fields */}
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  value={formState.shopName}
                  onChange={(e) => setFormState({ ...formState, shopName: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                {errors.shopName && (
                  <p className="text-sm text-purple-600 mt-1">{errors.shopName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formState.productName}
                  onChange={(e) => setFormState({ ...formState, productName: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                {errors.productName && (
                  <p className="text-sm text-purple-600 mt-1">{errors.productName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.price}
                  onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                {errors.price && (
                  <p className="text-sm text-purple-600 mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1">
                  Quality *
                </label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setFormState({ ...formState, quality: q })}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                        formState.quality === q
                          ? "bg-purple-500 text-white"
                          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      }`}
                    >
                      {q.charAt(0).toUpperCase() + q.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional fields */}
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1">
                  Audience
                </label>
                <select
                  value={formState.audience}
                  onChange={(e) => setFormState({ ...formState, audience: e.target.value as CompetitorFormState["audience"] })}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                >
                  <option value="">Select...</option>
                  <option value="kids">Kids</option>
                  <option value="gift">Gift</option>
                  <option value="hobbyist">Hobbyist</option>
                  <option value="parents">Parents</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1">
                  Packaging Quality
                </label>
                <select
                  value={formState.packagingQuality}
                  onChange={(e) => setFormState({ ...formState, packagingQuality: e.target.value as CompetitorFormState["packagingQuality"] })}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                >
                  <option value="">Select...</option>
                  <option value="basic">Basic</option>
                  <option value="nice">Nice</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-purple-700 mb-1">
                  Reason for Price
                </label>
                <textarea
                  value={formState.reason}
                  onChange={(e) => setFormState({ ...formState, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1">
                  Materials Note
                </label>
                <input
                  type="text"
                  value={formState.materialsNote}
                  onChange={(e) => setFormState({ ...formState, materialsNote: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1">
                  Shipping Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={formState.shippingDays}
                  onChange={(e) => setFormState({ ...formState, shippingDays: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                {errors.shippingDays && (
                  <p className="text-sm text-purple-600 mt-1">{errors.shippingDays}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1">
                  Rating (0-5)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formState.rating}
                  onChange={(e) => setFormState({ ...formState, rating: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                {errors.rating && (
                  <p className="text-sm text-purple-600 mt-1">{errors.rating}</p>
                )}
              </div>
            </div>

            {/* Form buttons */}
            <div className="flex gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="bg-purple-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
              >
                Save Competitor
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Try a Price Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="mt-10 w-full max-w-5xl bg-white rounded-3xl shadow-md border border-purple-100 p-6 z-10 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
      >
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-purple-600">Try a Price</h3>
          <p className="text-lg text-gray-600 mt-2">
            Slide to see how customers might react.
          </p>
        </div>

        {/* Current price display */}
        <div className="text-center mb-4">
          <span className="text-sm text-gray-600">Your price: </span>
          <span className="text-4xl font-bold text-purple-600">
            ${priceGuess.toFixed(2)}
          </span>
        </div>

        {/* Slider */}
        <input
          type="range"
          min="0"
          max={sliderMax}
          step="0.5"
          value={priceGuess}
          onChange={(e) => setPriceGuess(parseFloat(e.target.value))}
          className="w-full mt-4 accent-purple-500"
        />

        {/* Reaction */}
        <div className="mt-6">
          <p className="text-xl font-semibold text-purple-700 mt-4">
            {reaction.headline}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {reaction.helper}
          </p>
        </div>

        {/* Quick comparison row */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          <span className="text-xs px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
            Street low: ${competitorStats.minPrice.toFixed(2)}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
            Street average: ${competitorStats.avgPrice.toFixed(2)}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700">
            Street high: ${competitorStats.maxPrice.toFixed(2)}
          </span>
        </div>
      </motion.div>

      {/* Customer Types Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="mt-10 w-full max-w-5xl z-10"
      >
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-purple-600">Customer Types</h3>
          <p className="text-lg text-gray-600 mt-2">
            Different people care about different things.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 w-full">
          {/* Kids Buyer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-2 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">🎒</span></span>
            <h4 className="text-lg font-semibold text-purple-700">Kids Buyer</h4>
            <p className="text-sm text-gray-600">
              Parents looking for fun, safe products that kids will enjoy.
            </p>
            <div className="mt-2 pt-2 border-t border-purple-100">
              <p className="text-xs text-gray-500">Typical range:</p>
              <p className="text-sm font-semibold text-purple-600">
                ${Math.max(0, competitorStats.minPrice).toFixed(2)}–${Math.max(competitorStats.minPrice, competitorStats.avgPrice * 0.9).toFixed(2)}
              </p>
            </div>
          </motion.div>

          {/* Gift Buyer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-2 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">🎁</span></span>
            <h4 className="text-lg font-semibold text-purple-700">Gift Buyer</h4>
            <p className="text-sm text-gray-600">
              People buying for others who want something nice and presentable.
            </p>
            <div className="mt-2 pt-2 border-t border-purple-100">
              <p className="text-xs text-gray-500">Typical range:</p>
              <p className="text-sm font-semibold text-purple-600">
                ${Math.max(0, competitorStats.avgPrice * 0.9).toFixed(2)}–${Math.max(competitorStats.avgPrice * 0.9, competitorStats.avgPrice * 1.1).toFixed(2)}
              </p>
            </div>
          </motion.div>

          {/* Hobbyist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
            className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-2 transition-transform transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <span className="text-4xl"><span className="inline-block transition-transform hover:-translate-y-1">🧑‍🎨</span></span>
            <h4 className="text-lg font-semibold text-purple-700">Hobbyist</h4>
            <p className="text-sm text-gray-600">
              Serious crafters who value quality and are willing to pay more.
            </p>
            <div className="mt-2 pt-2 border-t border-purple-100">
              <p className="text-xs text-gray-500">Typical range:</p>
              <p className="text-sm font-semibold text-purple-600">
                ${Math.max(0, competitorStats.avgPrice * 1.1).toFixed(2)}–${Math.max(competitorStats.avgPrice * 1.1, competitorStats.maxPrice).toFixed(2)}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Your Spot on the Street Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.1 }}
        className="mt-10 w-full max-w-5xl bg-gradient-to-br from-purple-50 to-white ring-1 ring-purple-100 border border-purple-100 rounded-3xl p-6 flex flex-col gap-2 z-10"
      >
        <h3 className="text-xl font-semibold text-purple-700">Your Shop</h3>
        <p className="text-sm text-gray-600">
          Product: {userProduct.productName || "(name coming soon)"}
        </p>
        <p className="text-sm text-gray-600">
          Your price: ${priceGuess.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Finish the earlier steps and we'll place your product here with a recommended price.
        </p>
      </motion.div>

      {/* Learning Takeaway */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.2 }}
        className="mt-10 text-sm text-gray-600 text-center max-w-xl z-10 pb-8"
      >
        <p>
          Pricing isn't about being the cheapest. It's about matching your product to the right people.
        </p>
      </motion.div>
    </div>
  )
}

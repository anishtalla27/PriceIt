import React from 'react'
import { FaTrophy } from 'react-icons/fa'

export default function CelebrationStage() {
  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center justify-center px-4 text-center overflow-hidden">
      {/* Background floating circles */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-200 opacity-30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-20 w-56 h-56 rounded-full bg-purple-200 opacity-30 blur-3xl pointer-events-none"></div>

      {/* Confetti dots */}
      <div className="absolute top-10 left-1/3 w-3 h-3 rounded-full bg-purple-400"></div>
      <div className="absolute top-20 right-1/4 w-4 h-4 rounded-full bg-purple-300"></div>
      <div className="absolute top-32 left-1/4 w-2 h-2 rounded-full bg-purple-500"></div>
      <div className="absolute bottom-32 right-1/3 w-3 h-3 rounded-full bg-purple-400"></div>
      <div className="absolute bottom-24 left-1/2 w-4 h-4 rounded-full bg-purple-300"></div>
      <div className="absolute top-1/4 right-1/5 w-3 h-3 rounded-full bg-purple-500"></div>
      <div className="absolute bottom-1/3 left-1/5 w-2 h-2 rounded-full bg-purple-400"></div>
      <div className="absolute top-1/3 right-1/3 w-4 h-4 rounded-full bg-purple-300"></div>

      {/* Success heading */}
      <h1 className="text-5xl font-bold text-purple-600">You Did It!</h1>
      <p className="mt-2 text-lg text-gray-600">Your product is ready to launch soon!</p>

      {/* Summary card */}
      <div className="mt-10 bg-white rounded-3xl shadow-md border border-purple-100 p-8 w-full max-w-md flex flex-col gap-4 items-center">
        <FaTrophy className="text-5xl text-yellow-500" />
        <h2 className="text-2xl font-semibold text-purple-700">Final Results</h2>
        <div className="w-full flex flex-col gap-3 items-start">
          <p className="text-gray-600 text-sm">Product Name: (coming soon)</p>
          <p className="text-gray-600 text-sm">Estimated Price: (TBD)</p>
          <p className="text-gray-600 text-sm">Profit Margin: (later feature)</p>
        </div>
        <button className="mt-6 bg-purple-500 text-white px-10 py-3 rounded-full text-xl font-semibold shadow-lg hover:scale-105 transition">
          Play Again
        </button>
      </div>
    </div>
  )
}


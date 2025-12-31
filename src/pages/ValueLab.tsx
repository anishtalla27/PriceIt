import React from 'react'
import { FaStar, FaSparkles, FaUsers } from 'react-icons/fa'

export default function ValueLab() {
  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center pt-20 px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-52 h-52 rounded-full bg-purple-200 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 w-64 h-64 rounded-full bg-purple-200 opacity-30 blur-3xl" />

      {/* Title area */}
      <h1 className="text-4xl md:text-5xl font-bold text-purple-600 text-center">
        Value Lab
      </h1>
      <p className="mt-2 text-base md:text-lg text-gray-600 text-center max-w-xl">
        Think about why your product is special and who will love it.
      </p>

      {/* Value cards row */}
      <div className="mt-10 w-full max-w-5xl grid gap-6 md:grid-cols-3">
        {/* Quality Card */}
        <div className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3">
          <FaStar className="text-3xl text-yellow-500" />
          <h3 className="text-lg font-semibold text-purple-700">Quality</h3>
          <p className="text-sm text-gray-600">
            Is your product made really well and built to last?
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
            <div className="h-3 w-3 rounded-full bg-purple-500"></div>
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
          </div>
        </div>

        {/* Uniqueness Card */}
        <div className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3">
          <FaSparkles className="text-3xl text-purple-500" />
          <h3 className="text-lg font-semibold text-purple-700">Uniqueness</h3>
          <p className="text-sm text-gray-600">
            Does your product have something special that makes it different?
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
            <div className="h-3 w-3 rounded-full bg-purple-500"></div>
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
          </div>
        </div>

        {/* Target Audience Card */}
        <div className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3">
          <FaUsers className="text-3xl text-pink-500" />
          <h3 className="text-lg font-semibold text-purple-700">Target Audience</h3>
          <p className="text-sm text-gray-600">
            Who will love your product and want to buy it?
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
            <div className="h-3 w-3 rounded-full bg-purple-500"></div>
            <div className="h-3 w-3 rounded-full bg-purple-100"></div>
          </div>
        </div>
      </div>

      {/* Placeholder value chart box */}
      <div className="mt-10 w-full max-w-3xl bg-purple-50 border border-dashed border-purple-300 rounded-3xl p-6 text-center">
        <h3 className="text-md font-semibold text-purple-700">Future chart area</h3>
        <p className="mt-1 text-sm text-gray-600">
          Later, this space can show a bar chart that compares value and price.
        </p>
      </div>
    </div>
  )
}


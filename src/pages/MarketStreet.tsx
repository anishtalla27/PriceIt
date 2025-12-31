import React from 'react'
import { FaHeart, FaHeadphones, FaPalette } from 'react-icons/fa'

export default function MarketStreet() {
  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center pt-20 px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-52 h-52 rounded-full bg-purple-200 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 w-64 h-64 rounded-full bg-purple-200 opacity-30 blur-3xl" />

      {/* Title area */}
      <h1 className="text-4xl md:text-5xl font-bold text-purple-600 text-center">
        Market Street
      </h1>
      <p className="mt-2 text-base md:text-lg text-gray-600 text-center max-w-xl">
        See how other products in the market are priced.
      </p>

      {/* Comparison cards section */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3">
          <div className="flex items-center">
            <FaHeart className="text-4xl text-pink-500" />
            <div className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              Example
            </div>
          </div>
          <h3 className="text-lg font-semibold text-purple-700">Custom Sticker Pack</h3>
          <p className="text-sm text-gray-500">Fun stickers for kids to decorate their stuff</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-sm text-gray-500">Typical price</span>
            <span className="text-2xl font-bold text-purple-600">$12.00</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3">
          <div className="flex items-center">
            <FaHeadphones className="text-4xl text-blue-500" />
            <div className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              Example
            </div>
          </div>
          <h3 className="text-lg font-semibold text-purple-700">Kids Headphones</h3>
          <p className="text-sm text-gray-500">Colorful headphones designed for children</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-sm text-gray-500">Typical price</span>
            <span className="text-2xl font-bold text-purple-600">$25.00</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 flex flex-col gap-3">
          <div className="flex items-center">
            <FaPalette className="text-4xl text-pink-500" />
            <div className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              Example
            </div>
          </div>
          <h3 className="text-lg font-semibold text-purple-700">Art Supply Kit</h3>
          <p className="text-sm text-gray-500">Complete set of crayons, markers, and paper</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-sm text-gray-500">Typical price</span>
            <span className="text-2xl font-bold text-purple-600">$18.00</span>
          </div>
        </div>
      </div>

      {/* Your product panel */}
      <div className="mt-10 w-full max-w-xl bg-purple-50 border border-purple-100 rounded-3xl p-6 flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-purple-700">Your product price (coming soon)</h3>
        <p className="text-sm text-gray-600">
          Later, this section will compare your chosen price to the market examples above.
        </p>
      </div>
    </div>
  )
}


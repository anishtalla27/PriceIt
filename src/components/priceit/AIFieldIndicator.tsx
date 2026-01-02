import React from 'react'
import { FieldMetadata } from '../../context/AppState'

interface AIFieldIndicatorProps {
  metadata?: FieldMetadata
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper component that adds visual indicators for AI-filled fields.
 * Shows purple glow ring and "Filled by AI" label when field was updated by AI.
 */
export default function AIFieldIndicator({ metadata, children, className = '' }: AIFieldIndicatorProps) {
  const isAIFilled = metadata?.lastUpdatedBy === "ai"

  return (
    <div className={`relative ${className}`}>
      {children}
      {isAIFilled && (
        <>
          {/* Purple glow ring */}
          <div className="absolute inset-0 ring-2 ring-purple-300 rounded-lg pointer-events-none" />
          
          {/* AI label */}
          <div className="absolute -top-6 left-0 flex items-center gap-1">
            <span className="text-xs text-purple-600 font-semibold">✨ Filled by AI</span>
            {metadata.aiReason && (
              <div className="group relative">
                <span className="text-xs text-purple-400 cursor-help">ℹ️</span>
                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-white border border-purple-200 rounded-lg shadow-lg text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {metadata.aiReason}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}


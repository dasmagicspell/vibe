import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children?: React.ReactNode
}

/**
 * Info tooltip — renders an ⓘ icon (or custom children) that shows
 * a definition panel on hover/focus. Used for complexity, rigor,
 * browser tier, and defect density definitions.
 */
export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        className="ml-1 text-gray-400 hover:text-brand-600 focus:outline-none focus:text-brand-600 transition-colors"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        aria-label="Show definition"
      >
        {children ?? (
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9
                 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0
                 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75
                 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
      {visible && (
        <div
          role="tooltip"
          className="
            absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
            w-64 rounded-lg bg-gray-900 text-white text-xs leading-relaxed
            px-3 py-2 shadow-lg
          "
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

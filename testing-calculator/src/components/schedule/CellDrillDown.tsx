import { useEffect } from 'react'
import type { ScheduleCell, ScheduleRow } from '@/types'
import {
  CertaintyBadge,
  CERTAINTY_EXPLANATIONS,
  CERTAINTY_BREAKDOWN_LABELS,
} from '@/components/shared/CertaintyBadge'
import { formatRange, formatExpected } from '@/utils/modelHelpers'

interface CellDrillDownProps {
  cell: ScheduleCell
  row:  ScheduleRow
  onClose: () => void
}

/**
 * Full-screen overlay modal that appears when the user clicks a matrix cell.
 * Shows: test type + page, time estimate breakdown, certainty explanation,
 * and the list of test cases that make up the estimate.
 */
export function CellDrillDown({ cell, row, onClose }: CellDrillDownProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Test cases for ${row.label} — ${cell.testType}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
              {row.rowType === 'workflow' ? 'Workflow' : 'Page'}
            </p>
            <h2 className="text-base font-semibold text-gray-900">{row.label}</h2>
            <p className="text-sm text-brand-700 font-medium">{cell.testType}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {row.notes && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">
              Account manager notes
            </p>
            <p className="text-sm text-amber-950 leading-relaxed whitespace-pre-wrap">{row.notes}</p>
          </div>
        )}

        {/* Estimate summary strip */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-400">Range</p>
            <p className="text-sm font-semibold text-gray-900 font-mono">
              {formatRange(cell.estimate)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Expected</p>
            <p className="text-sm font-semibold text-gray-900 font-mono">
              {formatExpected(cell.estimate)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Certainty</p>
            <CertaintyBadge level={cell.certainty} />
          </div>
          {cell.needsReview && (
            <div className="ml-auto">
              <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                ⚠ Needs review
              </span>
            </div>
          )}
        </div>

        {/* Certainty explanation */}
        <div className="px-6 py-3 text-xs text-gray-500 bg-gray-50 border-b border-gray-100 space-y-2">
          <p>{CERTAINTY_EXPLANATIONS[cell.certainty]}</p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {(Object.keys(CERTAINTY_BREAKDOWN_LABELS) as Array<keyof typeof CERTAINTY_BREAKDOWN_LABELS>).map(key => (
              <div key={key} className="text-center">
                <p className="text-gray-400 mb-0.5">{CERTAINTY_BREAKDOWN_LABELS[key]}</p>
                <CertaintyBadge level={cell.certaintyBreakdown[key]} compact />
              </div>
            ))}
          </div>
        </div>

        {/* Test cases list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Test cases ({cell.testCases.length})
          </p>
          <ol className="space-y-2">
            {cell.testCases.map((tc, i) => (
              <li key={tc.id} className="flex gap-3">
                <span className="flex-none w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 leading-snug">{tc.description}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

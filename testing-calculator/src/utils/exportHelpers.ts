// =============================================================================
// exportHelpers.ts
// CSV generation for the schedule matrix + summary.
// Pure string-building functions plus a DOM-side download trigger.
// =============================================================================

import type { ScheduleOutput } from '@/types'
import { formatRange } from '@/utils/modelHelpers'

// ---------------------------------------------------------------------------
// CSV cell escaping
// ---------------------------------------------------------------------------

function cell(value: string | number): string {
  const s = String(value)
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function row(...values: Array<string | number>): string {
  return values.map(cell).join(',')
}

// ---------------------------------------------------------------------------
// Main CSV generator
// ---------------------------------------------------------------------------

/**
 * Generates a CSV string from the schedule output.
 *
 * Structure:
 *   1. Header row: page/workflow label, one column per test type, row total
 *   2. One data row per page/workflow
 *   3. Blank row
 *   4. Summary section with all overhead and deliverable line items
 */
export function generateScheduleCSV(output: ScheduleOutput): string {
  const lines: string[] = []
  const { activeTestTypes, rows } = output

  // ── Metadata ────────────────────────────────────────────────────────────
  lines.push(row('Project', output.projectName))
  lines.push(row('Client', output.clientName))
  lines.push(row('Generated', new Date(output.generatedAt).toLocaleString()))
  lines.push(row('Model', `${output.engineerName} v${output.modelVersion}`))
  lines.push(row('Rigor', output.rigorLevel, 'Browser tier', output.browserTier))
  lines.push('')

  // ── Matrix header ────────────────────────────────────────────────────────
  lines.push(row(
    'Page / Workflow',
    ...activeTestTypes,
    'Row total (expected hrs)',
    'Row range',
  ))

  // ── Matrix data rows ─────────────────────────────────────────────────────
  let lastType = rows[0]?.rowType

  for (const matrixRow of rows) {
    // Group separator
    if (matrixRow.rowType !== lastType) {
      lines.push('')
      lastType = matrixRow.rowType
    }

    const cellValues = activeTestTypes.map(tt => {
      const c = matrixRow.cells[tt]
      if (!c) return '0'
      if (c.isExcluded) return 'N/A'
      return c.estimate.expectedHours.toFixed(2)
    })

    lines.push(row(
      matrixRow.label,
      ...cellValues,
      matrixRow.subtotal.expectedHours.toFixed(2),
      formatRange(matrixRow.subtotal),
    ))
  }

  lines.push('')

  // ── Column totals row ────────────────────────────────────────────────────
  const colTotals = activeTestTypes.map(tt =>
    rows.reduce((sum, r) => sum + (r.cells[tt]?.estimate.expectedHours ?? 0), 0).toFixed(2)
  )
  lines.push(row('Column totals', ...colTotals, '', ''))
  lines.push('')

  // ── Summary section ───────────────────────────────────────────────────────
  lines.push(row('SUMMARY', 'Expected hrs', 'Range'))
  lines.push(row('Test execution subtotal',
    output.executionSubtotal.expectedHours.toFixed(2),
    formatRange(output.executionSubtotal),
  ))
  lines.push(row('Retesting',
    output.retestingEstimate.expectedHours.toFixed(2),
    formatRange(output.retestingEstimate),
  ))
  lines.push(row('Regression testing',
    output.regressionEstimate.expectedHours.toFixed(2),
    formatRange(output.regressionEstimate),
  ))
  lines.push(row('Coordination overhead',
    output.coordinationOverhead.expectedHours.toFixed(2),
    formatRange(output.coordinationOverhead),
  ))
  lines.push(row('Reporting overhead',
    output.reportingOverhead.expectedHours.toFixed(2),
    formatRange(output.reportingOverhead),
  ))

  for (const d of output.deliverableLineItems) {
    lines.push(row(d.label,
      d.estimate.expectedHours.toFixed(2),
      formatRange(d.estimate),
    ))
  }

  lines.push('')
  lines.push(row('TOTAL BILLABLE ESTIMATE',
    output.grandTotal.expectedHours.toFixed(2),
    formatRange(output.grandTotal),
  ))

  return lines.join('\r\n')   // CRLF for maximum Excel compatibility
}

// ---------------------------------------------------------------------------
// File download trigger (DOM side-effect — keep out of pure functions)
// ---------------------------------------------------------------------------

export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadCSV(output: ScheduleOutput): void {
  const csv      = generateScheduleCSV(output)
  const filename = `${output.clientName.replace(/\s+/g, '-')}-${output.projectName.replace(/\s+/g, '-')}-estimate.csv`
  downloadTextFile(csv, filename.toLowerCase(), 'text/csv;charset=utf-8;')
}

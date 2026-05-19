import { useState } from 'react'
import type { ScheduleOutput, ScheduleRow, ScheduleCell } from '@/types'
import { TestType } from '@/types'
import { CertaintyBadge } from '@/components/shared/CertaintyBadge'
import { CellDrillDown } from './CellDrillDown'
import { formatHours, formatRange } from '@/utils/modelHelpers'

interface ScheduleMatrixProps {
  output: ScheduleOutput
}

// Abbreviated labels for narrow column headers
const TEST_TYPE_SHORT: Partial<Record<TestType, string>> = {
  [TestType.Functional]:        'Functional',
  [TestType.UILayout]:          'UI/Layout',
  [TestType.ContentReview]:     'Content',
  [TestType.LinkValidation]:    'Links',
  [TestType.FormValidation]:    'Forms',
  [TestType.RolePermission]:    'Roles',
  [TestType.CrossBrowser]:      'X-Browser',
  [TestType.ResponsiveMobile]:  'Responsive',
  [TestType.Accessibility]:     'A11y',
  [TestType.Performance]:       'Perf',
  [TestType.SEOMeta]:           'SEO',
  [TestType.SecurityPrivacy]:   'Security',
  [TestType.AnalyticsTag]:      'Analytics',
  [TestType.CMSAdmin]:          'CMS',
  [TestType.EmailNotification]: 'Email',
  [TestType.ContentMigration]:  'Migration',
  [TestType.Exploratory]:       'Exploratory',
}

const CERTAINTY_CELL_BG: Record<string, string> = {
  High:   'hover:bg-green-50',
  Medium: 'hover:bg-yellow-50',
  Low:    'hover:bg-red-50',
}

interface SelectedCell {
  cell: ScheduleCell
  row:  ScheduleRow
}

/**
 * The pivot matrix table.
 * Rows = pages + workflows.  Columns = active test types.
 * Each cell shows the time range + certainty badge.
 * Clicking a cell opens the drill-down modal.
 * First column is sticky on horizontal scroll.
 */
export function ScheduleMatrix({ output }: ScheduleMatrixProps) {
  const [selected, setSelected] = useState<SelectedCell | null>(null)

  const { rows, activeTestTypes } = output

  // Separate pages and workflow rows for a group header
  const pageRows     = rows.filter(r => r.rowType === 'page')
  const workflowRows = rows.filter(r => r.rowType === 'workflow')

  function handleCellClick(row: ScheduleRow, testType: TestType) {
    const cell = row.cells[testType]
    if (cell) setSelected({ cell, row })
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="border-collapse text-xs w-full" style={{ minWidth: `${200 + activeTestTypes.length * 92}px` }}>

          {/* Column headers */}
          <thead>
            <tr className="bg-gray-50">
              {/* Sticky row-label column header */}
              <th
                scope="col"
                className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200
                           px-3 py-3 text-left text-xs font-semibold text-gray-500 w-48 min-w-48"
              >
                Page / Workflow
              </th>

              {/* Test type column headers */}
              {activeTestTypes.map(tt => (
                <th
                  key={tt}
                  scope="col"
                  className="border-b border-r border-gray-200 px-2 py-2 text-center
                             text-xs font-semibold text-gray-500 w-24 min-w-24"
                  title={tt}
                >
                  <span className="block truncate leading-tight">
                    {TEST_TYPE_SHORT[tt] ?? tt}
                  </span>
                </th>
              ))}

              {/* Row subtotal column */}
              <th
                scope="col"
                className="border-b border-gray-200 px-3 py-3 text-right text-xs font-semibold text-gray-700 w-28 min-w-28"
              >
                Row total
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Pages group */}
            {pageRows.length > 0 && (
              <>
                {workflowRows.length > 0 && (
                  <GroupHeaderRow
                    label={`Pages (${pageRows.length})`}
                    colSpan={activeTestTypes.length + 2}
                  />
                )}
                {pageRows.map(row => (
                  <MatrixRow
                    key={row.id}
                    row={row}
                    activeTestTypes={activeTestTypes}
                    onCellClick={handleCellClick}
                  />
                ))}
              </>
            )}

            {/* Workflows group */}
            {workflowRows.length > 0 && (
              <>
                <GroupHeaderRow
                  label={`Workflows (${workflowRows.length})`}
                  colSpan={activeTestTypes.length + 2}
                />
                {workflowRows.map(row => (
                  <MatrixRow
                    key={row.id}
                    row={row}
                    activeTestTypes={activeTestTypes}
                    onCellClick={handleCellClick}
                  />
                ))}
              </>
            )}

            {/* Grand execution subtotal row */}
            <tr className="bg-gray-50 border-t-2 border-gray-300">
              <td
                className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200
                           px-3 py-2.5 font-semibold text-gray-900"
              >
                Execution subtotal
              </td>
              {activeTestTypes.map(tt => {
                const colTotal = sumColumnEstimates(rows, tt)
                return (
                  <td key={tt} className="border-r border-gray-200 px-2 py-2 text-center font-mono text-gray-700">
                    {colTotal > 0 ? formatHours(colTotal) : '—'}
                  </td>
                )
              })}
              <td className="px-3 py-2.5 text-right font-semibold text-gray-900 font-mono">
                {formatRange(output.executionSubtotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Drill-down modal */}
      {selected && (
        <CellDrillDown
          cell={selected.cell}
          row={selected.row}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GroupHeaderRow({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr className="bg-brand-50">
      <td
        colSpan={colSpan}
        className="sticky left-0 z-10 bg-brand-50 px-3 py-1.5
                   text-xs font-semibold text-brand-700 uppercase tracking-wide"
      >
        {label}
      </td>
    </tr>
  )
}

interface MatrixRowProps {
  row:             ScheduleRow
  activeTestTypes: TestType[]
  onCellClick:     (row: ScheduleRow, tt: TestType) => void
}

function MatrixRow({ row, activeTestTypes, onCellClick }: MatrixRowProps) {
  return (
    <tr className="border-b border-gray-100 group">
      {/* Row label — sticky */}
      <td
        className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r border-gray-200
                   px-3 py-2 font-medium text-gray-900 transition-colors"
        style={{ maxWidth: '192px' }}
      >
        <span className="block truncate" title={row.label}>{row.label}</span>
        <span className="text-gray-400 font-normal text-xs">
          {row.rowType === 'workflow' ? 'workflow' : 'page'}
        </span>
        {row.notes && (
          <p className="mt-1 text-xs text-amber-800/90 line-clamp-2 leading-snug" title={row.notes}>
            {row.notes}
          </p>
        )}
      </td>

      {/* Test type cells */}
      {activeTestTypes.map(tt => {
        const cell = row.cells[tt]
        if (!cell) {
          return (
            <td key={tt} className="border-r border-gray-100 px-2 py-2 text-center text-gray-300">
              —
            </td>
          )
        }

        const hasTime = cell.estimate.expectedHours > 0

        return (
          <td
            key={tt}
            className={`
              border-r border-gray-100 px-2 py-2 text-center cursor-pointer
              transition-colors ${CERTAINTY_CELL_BG[cell.certainty]}
              ${cell.needsReview ? 'bg-red-50/60' : ''}
            `}
            onClick={() => onCellClick(row, tt)}
            title={`${row.label} — ${tt} — click for details`}
          >
            {hasTime ? (
              <>
                <span className="block font-mono text-gray-800 text-xs leading-tight">
                  {formatRange(cell.estimate)}
                </span>
                <span className="mt-0.5 inline-flex items-center gap-0.5">
                  <CertaintyBadge level={cell.certainty} compact />
                </span>
              </>
            ) : (
              <span className="text-gray-300 text-xs">—</span>
            )}
          </td>
        )
      })}

      {/* Row subtotal */}
      <td className="px-3 py-2 text-right font-mono text-gray-700 text-xs">
        {formatRange(row.subtotal)}
      </td>
    </tr>
  )
}

function sumColumnEstimates(rows: ScheduleRow[], testType: TestType): number {
  return rows.reduce((sum, row) => {
    const cell = row.cells[testType]
    return sum + (cell?.estimate.expectedHours ?? 0)
  }, 0)
}

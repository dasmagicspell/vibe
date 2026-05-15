import type { ScheduleOutput } from '@/types'
import { CertaintyBadge } from '@/components/shared/CertaintyBadge'
import { formatRange } from '@/utils/modelHelpers'

interface ScheduleSummaryProps {
  output: ScheduleOutput
  retestingIncluded: boolean
}

/**
 * Summary section rendered below the schedule matrix.
 * Shows: execution subtotal → retesting → regression → overhead → deliverables → grand total.
 * Includes the required educational callout on retesting vs. regression.
 */
export function ScheduleSummary({ output, retestingIncluded }: ScheduleSummaryProps) {
  const {
    executionSubtotal,
    retestingEstimate,
    regressionEstimate,
    coordinationOverhead,
    reportingOverhead,
    deliverableLineItems,
    grandTotal,
  } = output

  const hasRetesting = retestingIncluded &&
    (retestingEstimate.expectedHours > 0 || regressionEstimate.expectedHours > 0)

  return (
    <div className="space-y-6 print:mt-8">

      {/* Retesting / Regression callout — always shown when retesting is included */}
      {retestingIncluded && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900 leading-relaxed">
          <p className="font-semibold mb-1">Retesting and regression</p>
          <p>
            <strong>Retesting</strong> confirms that a specific reported issue was fixed.{' '}
            <strong>Regression testing</strong> checks whether the fix broke nearby or related functionality.
            These are related but separate activities and may be estimated separately depending on project risk.
          </p>
        </div>
      )}

      {/* Summary table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Estimate summary
          </p>
        </div>

        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">

            {/* Execution subtotal */}
            <SummaryRow
              label="Test execution subtotal"
              range={formatRange(executionSubtotal)}
              note="Active testing time across all pages, workflows, and test types"
              isBold
            />

            {/* Retesting */}
            {hasRetesting && (
              <>
                <SummaryRow
                  label="Retesting (defect verification)"
                  range={formatRange(retestingEstimate)}
                  note="Confirming specific bugs are fixed after dev corrects them"
                  indent
                />
                <SummaryRow
                  label="Regression testing"
                  range={formatRange(regressionEstimate)}
                  note="Checking that fixes haven't broken adjacent functionality"
                  indent
                />
              </>
            )}

            {/* Overhead */}
            <SummaryRow
              label={`Coordination overhead`}
              range={formatRange(coordinationOverhead)}
              note="Planning, communication, standups, and dev-team coordination"
              indent
            />
            <SummaryRow
              label={`Reporting overhead`}
              range={formatRange(reportingOverhead)}
              note="Writing bug reports, maintaining test matrix, status updates"
              indent
            />

            {/* Deliverables */}
            {deliverableLineItems.map((item, i) => (
              <SummaryRow
                key={i}
                label={item.label}
                range={formatRange(item.estimate)}
                note={item.tooltip}
                badge={<CertaintyBadge level={item.certainty} compact />}
                indent
              />
            ))}

            {/* Grand total */}
            <tr className="bg-gray-50 border-t-2 border-gray-300">
              <td className="px-4 py-3 font-bold text-gray-900">Total billable estimate</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900 font-mono text-base whitespace-nowrap">
                {formatRange(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Confidence note */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <CertaintyBadge level="High" compact />
          <span>Calibrated estimate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CertaintyBadge level="Medium" compact />
          <span>Interpolated — verify with engineer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CertaintyBadge level="Low" compact />
          <span>No data — add to calibration model</span>
        </div>
      </div>

      {/* Metadata footer */}
      <div className="text-xs text-gray-400 space-y-0.5">
        <p>Generated: {new Date(output.generatedAt).toLocaleString()}</p>
        <p>Model: {output.engineerName} v{output.modelVersion}</p>
        <p>Rigor: {output.rigorLevel} · Browser: {output.browserTier}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row sub-component
// ---------------------------------------------------------------------------

interface SummaryRowProps {
  label:  string
  range:  string
  note?:  string
  isBold?: boolean
  indent?: boolean
  badge?: React.ReactNode
}

function SummaryRow({ label, range, note, isBold, indent, badge }: SummaryRowProps) {
  return (
    <tr>
      <td className={`px-4 py-2.5 ${indent ? 'pl-8' : ''}`}>
        <div className="flex items-center gap-2">
          {badge}
          <span className={isBold ? 'font-semibold text-gray-900' : 'text-gray-700'}>
            {label}
          </span>
        </div>
        {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-gray-800 whitespace-nowrap">
        {range}
      </td>
    </tr>
  )
}

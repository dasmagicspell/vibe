import type { ProjectSpec } from '@/types'
import { TestType, ALWAYS_ACTIVE_TEST_TYPES, CONDITIONAL_TEST_TYPES, TEST_TYPE_DESCRIPTIONS } from '@/types'
import { getTestTypeActivationReason } from '@/utils/projectHelpers'
import { StepNav } from '@/components/calibration/StepWizard'

interface Props {
  project: ProjectSpec
  onChange: (updates: Partial<ProjectSpec>) => void
  onBack: () => void
  onNext: () => void
}

/**
 * Shows the account manager exactly which test types are active and why.
 * Always-active types are locked.
 * Auto-activated conditional types show their activation reason.
 * Opt-in types (exploratory, automation, CMS admin) have toggles.
 */
export function Section8TestTypes({ project, onChange, onBack, onNext }: Props) {
  const activeTypes = new Set(project.selectedTestTypes)

  function setOptIn(
    field: 'includeExploratory' | 'includeAutomation' | 'includeCMSAdmin',
    value: boolean,
  ) {
    onChange({ [field]: value })
    // Note: deriveActiveTestTypes is called in IntakeView's updateDraft,
    // so selectedTestTypes will re-sync automatically.
  }

  const autoActivatedConditional = CONDITIONAL_TEST_TYPES.filter(tt => {
    if ([TestType.Exploratory, TestType.E2EAutomation, TestType.CMSAdmin].includes(tt)) return false
    return activeTypes.has(tt)
  })

  const notActivatedConditional = CONDITIONAL_TEST_TYPES.filter(tt => {
    if ([TestType.Exploratory, TestType.E2EAutomation, TestType.CMSAdmin].includes(tt)) return false
    return !activeTypes.has(tt)
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Test types</h2>
        <p className="mt-1 text-sm text-gray-500">
          These are the columns in your schedule matrix. Types are activated automatically
          based on your earlier answers. Review what's included and opt in to any additional coverage.
        </p>
      </div>

      {/* Always-active */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Always included ({ALWAYS_ACTIVE_TEST_TYPES.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {ALWAYS_ACTIVE_TEST_TYPES.map(tt => (
            <TestTypePill
              key={tt}
              testType={tt}
              status="always"
              tooltip={TEST_TYPE_DESCRIPTIONS[tt]}
            />
          ))}
        </div>
      </div>

      {/* Auto-activated conditional types */}
      {autoActivatedConditional.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Auto-activated based on your project ({autoActivatedConditional.length})
          </h3>
          <div className="space-y-2">
            {autoActivatedConditional.map(tt => {
              const reason = getTestTypeActivationReason(tt, project)
              return (
                <div
                  key={tt}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-green-50 border border-green-200"
                >
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-none" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483
                         4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <span className="text-sm font-medium text-green-800">{tt}</span>
                    {reason && (
                      <p className="text-xs text-green-600 mt-0.5">{reason}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Not activated conditional types */}
      {notActivatedConditional.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Not activated (conditions not met)
          </h3>
          <div className="flex flex-wrap gap-2">
            {notActivatedConditional.map(tt => (
              <TestTypePill
                key={tt}
                testType={tt}
                status="inactive"
                tooltip={TEST_TYPE_DESCRIPTIONS[tt]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Opt-in types */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Optional coverage — opt in
        </h3>

        <OptInRow
          label={TestType.Exploratory}
          description={TEST_TYPE_DESCRIPTIONS[TestType.Exploratory]}
          checked={project.includeExploratory}
          onToggle={v => setOptIn('includeExploratory', v)}
        >
          {project.includeExploratory && (
            <div className="mt-2 ml-6 flex items-center gap-2">
              <label htmlFor="exploratory-hours" className="text-xs text-gray-500">
                Time block (hours):
              </label>
              <input
                id="exploratory-hours"
                type="number"
                min={1}
                step={1}
                value={project.exploratoryBlockHours ?? 2}
                onChange={e => onChange({ exploratoryBlockHours: parseInt(e.target.value) || 2 })}
                className="w-16 px-2 py-1 text-sm rounded border border-gray-300 text-right
                           focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}
        </OptInRow>

        <OptInRow
          label={TestType.E2EAutomation}
          description="Automated test authoring and execution — quoted as a single line-item total."
          checked={project.includeAutomation}
          onToggle={v => setOptIn('includeAutomation', v)}
        />

        <OptInRow
          label={TestType.CMSAdmin}
          description="Testing the CMS backend (WordPress admin, Shopify dashboard, etc.)."
          checked={project.includeCMSAdmin}
          onToggle={v => setOptIn('includeCMSAdmin', v)}
        />
      </div>

      {/* Active count summary */}
      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600">
        <strong>{project.selectedTestTypes.length}</strong> test types active —
        these will form the columns of your schedule matrix.
      </div>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface TestTypePillProps {
  testType: TestType
  status: 'always' | 'active' | 'inactive'
  tooltip: string
}

function TestTypePill({ testType, status, tooltip }: TestTypePillProps) {
  const styles = {
    always:  'bg-brand-100 text-brand-800 border border-brand-200',
    active:  'bg-green-100 text-green-800 border border-green-200',
    inactive:'bg-gray-100  text-gray-500  border border-gray-200',
  }
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      title={tooltip}
    >
      {testType}
    </span>
  )
}

interface OptInRowProps {
  label: TestType
  description: string
  checked: boolean
  onToggle: (v: boolean) => void
  children?: React.ReactNode
}

function OptInRow({ label, description, checked, onToggle, children }: OptInRowProps) {
  return (
    <div className={`p-3 rounded-xl border transition-all ${checked ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white'}`}>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onToggle(e.target.checked)}
          className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <div>
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </label>
      {children}
    </div>
  )
}

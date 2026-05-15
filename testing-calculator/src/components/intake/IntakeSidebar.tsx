interface SidebarSection {
  label: string
  isComplete: boolean
  isRequired: boolean
}

interface IntakeSidebarProps {
  sections: SidebarSection[]
  currentSection: number
  onNavigate: (index: number) => void
  canGenerate: boolean
  onGenerate: () => void
}

/**
 * Left sidebar for the intake form.
 * Shows all sections with completion status; allows free navigation.
 * On desktop: sticky vertical sidebar.
 * On mobile: rendered as a scrollable horizontal pill row (via CSS).
 */
export function IntakeSidebar({
  sections, currentSection, onNavigate, canGenerate, onGenerate,
}: IntakeSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col gap-1 w-52 flex-none sticky top-20 self-start">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-1">
          Sections
        </p>

        {sections.map((section, index) => {
          const isActive = index === currentSection
          const isLast   = index === sections.length - 1

          return (
            <button
              key={section.label}
              type="button"
              onClick={() => onNavigate(index)}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left
                transition-all w-full
                ${isActive
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                ${isLast ? 'mt-2 border-t border-gray-200 pt-3' : ''}
              `}
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Completion indicator */}
              <span className="flex-none">
                {section.isComplete ? (
                  <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483
                         4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span
                    className={`
                      flex items-center justify-center w-4 h-4 rounded-full text-xs font-semibold
                      ${isActive
                        ? 'bg-brand-600 text-white'
                        : section.isRequired
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-200 text-gray-500'}
                    `}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                )}
              </span>
              <span className="truncate">{section.label}</span>
              {section.isRequired && !section.isComplete && (
                <span className="ml-auto flex-none text-xs text-amber-500">*</span>
              )}
            </button>
          )
        })}

        {/* Generate button in sidebar */}
        <div className="mt-4 px-1">
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`
              w-full py-2 rounded-lg text-sm font-semibold transition-colors
              ${canGenerate
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
          >
            Generate schedule
          </button>
          {!canGenerate && (
            <p className="text-xs text-gray-400 text-center mt-1">
              Complete required sections first
            </p>
          )}
        </div>
      </aside>

      {/* Mobile: horizontal scrollable pills */}
      <div className="lg:hidden overflow-x-auto pb-2 mb-4">
        <div className="flex gap-2 w-max">
          {sections.map((section, index) => {
            const isActive = index === currentSection
            return (
              <button
                key={section.label}
                type="button"
                onClick={() => onNavigate(index)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  whitespace-nowrap border transition-all
                  ${isActive
                    ? 'bg-brand-600 text-white border-brand-600'
                    : section.isComplete
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-white text-gray-600 border-gray-300'}
                `}
                aria-current={isActive ? 'step' : undefined}
              >
                {section.isComplete && !isActive && (
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75
                         0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {section.label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

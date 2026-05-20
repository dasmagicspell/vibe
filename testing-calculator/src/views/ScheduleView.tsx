import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ClientScopeDoc, CertaintyMultipliers } from '@/types'
import { useApp, useSchedule, useModel, useProject } from '@/context/AppContext'
import { runCalculationEngine }   from '@/services/CalculationEngine'
import { StorageService }         from '@/services/StorageService'
import { generateClientScopeDoc } from '@/utils/scopeDocHelpers'
import { downloadCSV }            from '@/utils/exportHelpers'
import { canAccessSchedule, getScheduleBlockers } from '@/utils/projectHelpers'
import { ScheduleMatrix }            from '@/components/schedule/ScheduleMatrix'
import { ScheduleCertaintyMultipliers } from '@/components/schedule/ScheduleCertaintyMultipliers'
import { ScheduleEstimationFormula } from '@/components/schedule/ScheduleEstimationFormula'
import { ScheduleSummary } from '@/components/schedule/ScheduleSummary'
import { ReviewFlags }     from '@/components/schedule/ReviewFlags'
import { ClientScopeTab }  from '@/components/schedule/ClientScopeTab'
import { IntegrationIntakeNotes } from '@/components/schedule/IntegrationIntakeNotes'

type ActiveTab = 'schedule' | 'scope'

export function ScheduleView() {
  const { dispatch } = useApp()
  const schedule = useSchedule()
  const model    = useModel()
  const project  = useProject()
  const navigate = useNavigate()

  const [activeTab, setActiveTab]   = useState<ActiveTab>('schedule')
  const [scopeDoc, setScopeDoc]     = useState<ClientScopeDoc | null>(null)

  const scheduleReady = canAccessSchedule(model, project)

  // ── Auto-compute schedule if missing and prerequisites are met ─────────────
  useEffect(() => {
    if (!schedule && scheduleReady && model && project) {
      dispatch({ type: 'SET_SCHEDULE', schedule: runCalculationEngine(model, project) })
    }
  }, [schedule, scheduleReady, model, project, dispatch])

  // ── Build scope doc when schedule is available ────────────────────────────
  useEffect(() => {
    if (schedule && project && !scopeDoc) {
      setScopeDoc(generateClientScopeDoc(project, schedule, project.retestingIncluded))
    }
  }, [schedule, project, scopeDoc])

  // ── Regenerate with current model ─────────────────────────────────────────
  const regenerate = useCallback(() => {
    if (model && project) {
      const fresh = runCalculationEngine(model, project)
      dispatch({ type: 'SET_SCHEDULE', schedule: fresh })
      setScopeDoc(null)  // force regeneration of scope doc
    }
  }, [model, project, dispatch])

  function handleTeMultipliersChange(teCertaintyMultipliers: CertaintyMultipliers) {
    if (!model) return
    const nextModel = { ...model, teCertaintyMultipliers }
    dispatch({ type: 'SET_MODEL', model: nextModel })
    if (project) {
      dispatch({ type: 'SET_SCHEDULE', schedule: runCalculationEngine(nextModel, project) })
      setScopeDoc(null)
    }
  }

  function handleAmMultipliersChange(amConfidenceMultipliers: CertaintyMultipliers) {
    if (!model || !project) return
    const nextProject = { ...project, amConfidenceMultipliers }
    dispatch({ type: 'SET_PROJECT', project: nextProject })
    dispatch({ type: 'SET_SCHEDULE', schedule: runCalculationEngine(model, nextProject) })
    setScopeDoc(null)
  }

  async function handleImportModel() {
    try {
      const imported = await StorageService.importModelFromFile()
      dispatch({ type: 'SET_MODEL', model: imported })
      dispatch({ type: 'MARK_MODEL_CLEAN' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not import model file.')
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  const blockers = getScheduleBlockers(model, project)
  if (blockers.length > 0) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16">
        <p className="text-lg font-semibold text-gray-900 mb-2 text-center">
          Schedule not available
        </p>
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1 mb-6">
          {blockers.map(msg => (
            <p key={msg} className="text-sm text-red-700">• {msg}</p>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/intake')}
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 transition-colors"
          >
            Go to intake form
          </button>
          {!model && (
            <button
              type="button"
              onClick={handleImportModel}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
            >
              Import testing model
            </button>
          )}
        </div>
      </main>
    )
  }

  if (!schedule) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500">Computing schedule…</p>
      </main>
    )
  }

  if (!model || !project) return null

  const modelVersionMismatch = model.version !== schedule.modelVersion

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 print-only:text-2xl">
            {schedule.projectName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {schedule.clientName} · {schedule.rigorLevel} rigor · {schedule.browserTier} browser tier
          </p>
        </div>

        {/* Action buttons */}
        <div className="no-print flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/intake')}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-600 border border-gray-300
                       hover:bg-gray-50 transition-colors"
          >
            ← Edit intake
          </button>
          <button
            type="button"
            onClick={() => downloadCSV(schedule)}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-600 border border-gray-300
                       hover:bg-gray-50 transition-colors"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white
                       hover:bg-brand-700 transition-colors"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Model version mismatch warning ─────────────────────────────────── */}
      {modelVersionMismatch && (
        <div className="no-print flex items-center gap-3 p-3 rounded-xl bg-amber-50
                        border border-amber-200 text-sm text-amber-800">
          <svg className="w-4 h-4 text-amber-500 flex-none" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516
                 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75
                 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            This schedule was generated with model <strong>v{schedule.modelVersion}</strong>, but the
            currently loaded model is <strong>v{model.version}</strong>.{' '}
            <button
              type="button"
              onClick={regenerate}
              className="underline font-medium hover:text-amber-900 transition-colors"
            >
              Regenerate with current model
            </button>
          </span>
        </div>
      )}

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="no-print flex gap-1 border-b border-gray-200">
        {(['schedule', 'scope'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
              ${activeTab === tab
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
            aria-selected={activeTab === tab}
            role="tab"
          >
            {tab === 'schedule' ? '📊 Internal schedule' : '📄 Client scope'}
          </button>
        ))}
      </div>

      {/* ── Schedule tab ───────────────────────────────────────────────────── */}
      <div className={activeTab === 'schedule' ? 'block space-y-8' : 'hidden'}>
        {/* Tip — hidden on print */}
        <p className="no-print text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          💡 Click any cell in the matrix to see the individual test cases that make up the estimate.
        </p>

        <IntegrationIntakeNotes project={project} />

        {/* Matrix */}
        <section aria-label="Estimation matrix">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Estimation matrix
            <span className="ml-2 text-gray-400 font-normal">
              {schedule.rows.length} row{schedule.rows.length !== 1 ? 's' : ''} ×{' '}
              {schedule.activeTestTypes.length} test types
            </span>
          </h2>
          <ScheduleEstimationFormula schedule={schedule} project={project} model={model} />
          <ScheduleCertaintyMultipliers
            model={model}
            project={project}
            onModelMultipliersChange={handleTeMultipliersChange}
            onProjectMultipliersChange={handleAmMultipliersChange}
          />
          <ScheduleMatrix output={schedule} model={model} project={project} />
        </section>

        {/* Summary */}
        <section aria-label="Estimate summary">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Estimate summary</h2>
          <ScheduleSummary
            output={schedule}
            retestingIncluded={project.retestingIncluded}
          />
        </section>

        {/* Review flags */}
        {schedule.reviewFlags.length > 0 && (
          <section aria-label="Review flags" className="no-print">
            <ReviewFlags flags={schedule.reviewFlags} />
          </section>
        )}
      </div>

      {/* ── Client scope tab ───────────────────────────────────────────────── */}
      <div className={activeTab === 'scope' ? 'block' : 'hidden'}>
        {scopeDoc ? (
          <ClientScopeTab
            doc={scopeDoc}
            onChange={setScopeDoc}
          />
        ) : (
          <div className="text-sm text-gray-400 text-center py-12">
            Building scope document…
          </div>
        )}
      </div>

    </main>
  )
}

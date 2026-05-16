import { useNavigate } from 'react-router-dom'
import { useApp, useModel } from '@/context/AppContext'
import { StorageService } from '@/services/StorageService'
import { getAppBuildDate, getAppVersion } from '@/utils/appMeta'
import type { AppRole } from '@/types'

export function HomeView() {
  const { dispatch } = useApp()
  const model    = useModel()
  const navigate = useNavigate()

  async function handleImportModel() {
    try {
      const imported = await StorageService.importModelFromFile()
      dispatch({ type: 'SET_MODEL', model: imported })
      dispatch({ type: 'MARK_MODEL_CLEAN' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not import model file.')
    }
  }

  function selectRole(role: AppRole) {
    dispatch({ type: 'SET_ROLE', role })
    if (role === 'engineer') navigate('/calibrate')
    else navigate('/intake')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gray-50">
      <div className="max-w-xl w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="bg-brand-600 text-white rounded-lg px-3 py-1.5 text-sm font-mono font-semibold">
              QA Calc
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            QA Estimation Calculator
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            An internal tool for A Positive Future test engineers and account managers.
            <br />
            Build data-driven test schedules from calibrated estimates.
          </p>
        </div>

        {/* Model status */}
        {model ? (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Testing model loaded</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Engineer: {model.engineerName} · Version {model.version} · Calibrated{' '}
                  {new Date(model.calibratedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => dispatch({ type: 'CLEAR_MODEL' })}
                className="text-xs text-green-700 hover:text-green-900 underline"
              >
                Unload
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm font-medium text-amber-800">No testing model loaded</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Account managers: import the shared{' '}
              <code className="font-mono bg-amber-100 px-1 rounded">testing-model.json</code>{' '}
              file from the team's shared folder before starting an intake.
            </p>
            <button
              onClick={handleImportModel}
              className="mt-3 text-xs px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Import model file
            </button>
          </div>
        )}

        {/* Role selection */}
        <div className="grid grid-cols-2 gap-4">
          <RoleCard
            icon="🔧"
            title="Test engineer"
            description="Build or update the calibration model with your time estimates and parameters."
            action="Open calibration"
            onClick={() => selectRole('engineer')}
          />
          <RoleCard
            icon="📋"
            title="Account manager"
            description="Define a new project and generate a time and task estimate schedule."
            action="Start intake"
            disabled={!model}
            disabledReason="Import a testing model first"
            onClick={() => selectRole('manager')}
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          A Positive Future · Internal tool · All data stays on your device
          <br />
          v{getAppVersion()} · Built {getAppBuildDate()}
        </p>
      </div>
    </main>
  )
}

interface RoleCardProps {
  icon: string
  title: string
  description: string
  action: string
  disabled?: boolean
  disabledReason?: string
  onClick: () => void
}

function RoleCard({
  icon, title, description, action, disabled, disabledReason, onClick
}: RoleCardProps) {
  return (
    <div
      className={`
        p-5 rounded-xl border-2 transition-all flex flex-col gap-3
        ${disabled
          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
          : 'border-gray-200 bg-white hover:border-brand-400 hover:shadow-sm cursor-pointer'}
      `}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={e => { if (!disabled && e.key === 'Enter') onClick() }}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
        {disabled && disabledReason && (
          <p className="text-xs text-amber-600 mt-1">{disabledReason}</p>
        )}
      </div>
      <button
        disabled={disabled}
        className={`
          w-full text-xs py-1.5 rounded-lg font-medium transition-colors
          ${disabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-brand-600 text-white hover:bg-brand-700'}
        `}
        onClick={e => { e.stopPropagation(); if (!disabled) onClick() }}
      >
        {action}
      </button>
    </div>
  )
}

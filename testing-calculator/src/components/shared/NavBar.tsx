import { Link, useLocation } from 'react-router-dom'
import { useApp, useModel, useRole } from '@/context/AppContext'
import { StorageService } from '@/services/StorageService'

export function NavBar() {
  const location = useLocation()
  const { state, dispatch } = useApp()
  const model = useModel()
  const role  = useRole()

  const navItems = [
    {
      to:    '/calibrate',
      label: 'Calibrate',
      role:  'engineer' as const,
      desc:  'Build the testing model',
    },
    {
      to:    '/intake',
      label: 'Project intake',
      role:  'manager' as const,
      desc:  'Define the site and goals',
    },
    {
      to:    '/schedule',
      label: 'Schedule',
      role:  'manager' as const,
      desc:  'View and print the estimate',
    },
  ]

  const isActive = (to: string) => location.pathname.startsWith(to)

  async function handleImportModel() {
    try {
      const imported = await StorageService.importModelFromFile()
      dispatch({ type: 'SET_MODEL', model: imported })
      dispatch({ type: 'MARK_MODEL_CLEAN' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed')
    }
  }

  async function handleImportProject() {
    try {
      const imported = await StorageService.importProjectFromFile()
      dispatch({ type: 'SET_PROJECT', project: imported })
      dispatch({ type: 'MARK_PROJECT_CLEAN' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not import project file.')
    }
  }

  return (
    <nav className="no-print bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="bg-brand-600 text-white rounded px-1.5 py-0.5 text-xs font-mono">
              QA
            </span>
            <span>Estimation Calculator</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${isActive(item.to)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
                `}
                title={item.desc}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Model status + actions */}
          <div className="flex items-center gap-2">
            {model ? (
              <>
                <span className="text-xs text-gray-500">
                  Model:{' '}
                  <span className="font-medium text-gray-700">{model.engineerName}</span>
                  {' '}v{model.version}
                </span>
                {state.modelDirty && (
                  <span className="text-xs text-amber-600 font-medium">● unsaved</span>
                )}
                {role === 'manager' && (
                  <button
                    onClick={handleImportProject}
                    className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    title="Load a previously saved project JSON file"
                  >
                    Load project
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleImportModel}
                className="text-xs px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                Import model
              </button>
            )}

            {/* Role badge */}
            {role && (
              <button
                onClick={() => dispatch({ type: 'SET_ROLE', role: null })}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors capitalize"
                title="Click to switch role"
              >
                {role === 'engineer' ? '🔧 Engineer' : '📋 Account manager'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

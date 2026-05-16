import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type {
  AppState,
  AppRole,
  TestingModel,
  ProjectSpec,
  ScheduleOutput,
  ClientScopeDoc,
} from '@/types'
import { StorageService } from '@/services/StorageService'
import { normalizeTestingModel } from '@/utils/modelHelpers'

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type AppAction =
  | { type: 'SET_ROLE';      role: AppRole }
  | { type: 'SET_MODEL';     model: TestingModel }
  | { type: 'CLEAR_MODEL' }
  | { type: 'SET_PROJECT';   project: ProjectSpec }
  | { type: 'CLEAR_PROJECT' }
  | { type: 'SET_SCHEDULE';  schedule: ScheduleOutput }
  | { type: 'CLEAR_SCHEDULE' }
  | { type: 'SET_SCOPE_DOC'; doc: ClientScopeDoc }
  | { type: 'MARK_MODEL_CLEAN' }
  | { type: 'MARK_PROJECT_CLEAN' }

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: AppState = {
  role:         null,
  model:        StorageService.loadModelFromSession(),
  project:      StorageService.loadProjectFromSession(),
  schedule:     null,
  scopeDoc:     null,
  modelDirty:   false,
  projectDirty: false,
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.role }

    case 'SET_MODEL':
      return { ...state, model: normalizeTestingModel(action.model), modelDirty: true }

    case 'CLEAR_MODEL':
      return { ...state, model: null, modelDirty: false }

    case 'SET_PROJECT':
      return { ...state, project: action.project, schedule: null, projectDirty: true }

    case 'CLEAR_PROJECT':
      return { ...state, project: null, schedule: null, scopeDoc: null, projectDirty: false }

    case 'SET_SCHEDULE':
      return { ...state, schedule: action.schedule }

    case 'CLEAR_SCHEDULE':
      return { ...state, schedule: null }

    case 'SET_SCOPE_DOC':
      return { ...state, scopeDoc: action.doc }

    case 'MARK_MODEL_CLEAN':
      return { ...state, modelDirty: false }

    case 'MARK_PROJECT_CLEAN':
      return { ...state, projectDirty: false }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AppContextValue {
  state:    AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Auto-persist model and project to localStorage whenever they change
  useEffect(() => {
    if (state.model) {
      StorageService.saveModelToSession(state.model)
    } else {
      StorageService.clearModelFromSession()
    }
  }, [state.model])

  useEffect(() => {
    if (state.project) {
      StorageService.saveProjectToSession(state.project)
    } else {
      StorageService.clearProjectFromSession()
    }
  }, [state.project])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// Convenience selectors
export function useModel()    { return useApp().state.model }
export function useProject()  { return useApp().state.project }
export function useSchedule() { return useApp().state.schedule }
export function useRole()     { return useApp().state.role }

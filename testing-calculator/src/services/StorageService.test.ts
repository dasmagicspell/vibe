import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService } from './StorageService'
import type { TestingModel, ProjectSpec } from '@/types'
import { DefectDensity } from '@/types'

// Minimal valid fixtures
const validModel: TestingModel = {
  version:       '1.0.0',
  engineerName:  'Jane Tester',
  calibratedAt:  '2025-01-15T00:00:00Z',
  entries:       [],
  browserCalibration: [],
  overheadFactors: {
    coordinationFraction: 0.12,
    reportingFraction:    0.15,
    defaultDefectDensity: DefectDensity.Medium,
  },
  deliverableEstimates: [],
  exploratoryBlocks:    [],
}

const validProject: ProjectSpec = {
  projectName:   'Acme Website',
  clientName:    'Acme Corp',
  createdAt:     '2025-01-20T00:00:00Z',
  siteType:      'Ecommerce' as never,
  projectMoment: 'NewLaunch' as never,
  sensitiveData: 'None' as never,
  paymentScope:        'None' as never,
  accountScope:        'None' as never,
  notificationScope:   'No notifications' as never,
  riskLevel:     'Medium' as never,
  pages:         [],
  workflows:     [],
  integrations:  [],
  rigorLevel:           'Standard' as never,
  rigorCertainty:       'High' as never,
  browserTier:          'Standard' as never,
  browserTierCertainty: 'High' as never,
  selectedTestTypes:     [],
  includeExploratory:    false,
  includeAutomation:     false,
  includeCMSAdmin:       false,
  selectedDeliverables:  [],
  reportingLevel:        'InternalBugList' as never,
  retestingIncluded:     true,
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear:      () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// ---------------------------------------------------------------------------

describe('StorageService — localStorage', () => {
  beforeEach(() => localStorageMock.clear())

  it('saves and loads a valid TestingModel', () => {
    StorageService.saveModelToSession(validModel)
    const loaded = StorageService.loadModelFromSession()
    expect(loaded).not.toBeNull()
    expect(loaded?.engineerName).toBe('Jane Tester')
  })

  it('returns null for missing model', () => {
    expect(StorageService.loadModelFromSession()).toBeNull()
  })

  it('returns null for corrupted model JSON', () => {
    localStorage.setItem('apf_qacalc_model_v1', '{broken json')
    expect(StorageService.loadModelFromSession()).toBeNull()
  })

  it('returns null if model JSON is missing required fields', () => {
    localStorage.setItem('apf_qacalc_model_v1', JSON.stringify({ foo: 'bar' }))
    expect(StorageService.loadModelFromSession()).toBeNull()
  })

  it('clears the model from session', () => {
    StorageService.saveModelToSession(validModel)
    StorageService.clearModelFromSession()
    expect(StorageService.loadModelFromSession()).toBeNull()
  })

  it('saves and loads a valid ProjectSpec', () => {
    StorageService.saveProjectToSession(validProject)
    const loaded = StorageService.loadProjectFromSession()
    expect(loaded?.projectName).toBe('Acme Website')
  })

  it('returns null for corrupted project JSON', () => {
    localStorage.setItem('apf_qacalc_project_v1', 'not-json')
    expect(StorageService.loadProjectFromSession()).toBeNull()
  })
})

describe('StorageService — file export', () => {
  it('triggers a download when exporting a model', () => {
    const clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickSpy, } as unknown as HTMLElement
      }
      return document.createElement(tag)
    })

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
    globalThis.URL.revokeObjectURL = vi.fn()

    StorageService.exportModelToFile(validModel)
    expect(clickSpy).toHaveBeenCalledOnce()
  })
})

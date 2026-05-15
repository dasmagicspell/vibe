// =============================================================================
// StorageService
// Handles two persistence layers:
//   1. localStorage  — session scratch-pad, survives page refresh
//   2. JSON file     — shared model file exported/imported via file picker
// =============================================================================

import type { TestingModel, ProjectSpec } from '@/types'
import { STORAGE_KEYS } from '@/types'

// ---------------------------------------------------------------------------
// Type guards — validate imported JSON before trusting it
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isTestingModel(v: unknown): v is TestingModel {
  if (!isObject(v)) return false
  return (
    typeof v['version']      === 'string' &&
    typeof v['engineerName'] === 'string' &&
    typeof v['calibratedAt'] === 'string' &&
    Array.isArray(v['entries'])
  )
}

function isProjectSpec(v: unknown): v is ProjectSpec {
  if (!isObject(v)) return false
  return (
    typeof v['projectName'] === 'string' &&
    typeof v['clientName']  === 'string' &&
    Array.isArray(v['pages'])
  )
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

export const StorageService = {

  // --- Model (localStorage) -------------------------------------------------

  saveModelToSession(model: TestingModel): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MODEL, JSON.stringify(model))
    } catch {
      console.warn('StorageService: could not save model to localStorage')
    }
  },

  loadModelFromSession(): TestingModel | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MODEL)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      return isTestingModel(parsed) ? parsed : null
    } catch {
      return null
    }
  },

  clearModelFromSession(): void {
    localStorage.removeItem(STORAGE_KEYS.MODEL)
  },

  // --- Project (localStorage) -----------------------------------------------

  saveProjectToSession(project: ProjectSpec): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project))
    } catch {
      console.warn('StorageService: could not save project to localStorage')
    }
  },

  loadProjectFromSession(): ProjectSpec | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECT)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      return isProjectSpec(parsed) ? parsed : null
    } catch {
      return null
    }
  },

  clearProjectFromSession(): void {
    localStorage.removeItem(STORAGE_KEYS.PROJECT)
  },

  // --- JSON file export (download) ------------------------------------------

  exportModelToFile(model: TestingModel): void {
    const json = JSON.stringify(model, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `testing-model-${model.engineerName.replace(/\s+/g, '-').toLowerCase()}-v${model.version}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  exportProjectToFile(project: ProjectSpec): void {
    const json = JSON.stringify(project, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `project-${project.clientName.replace(/\s+/g, '-').toLowerCase()}-${project.projectName.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  // --- JSON file import (file picker) ---------------------------------------

  /**
   * Opens a file picker and returns the parsed TestingModel.
   * Rejects if the file is not valid JSON or fails the type guard.
   */
  importModelFromFile(): Promise<TestingModel> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type   = 'file'
      input.accept = '.json,application/json'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) { reject(new Error('No file selected')); return }
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const parsed: unknown = JSON.parse(reader.result as string)
            if (isTestingModel(parsed)) {
              resolve(parsed)
            } else {
              reject(new Error(
                'This file does not appear to be a valid Testing Model. ' +
                'Make sure you are importing a file exported from this app.'
              ))
            }
          } catch {
            reject(new Error('The selected file is not valid JSON.'))
          }
        }
        reader.onerror = () => reject(new Error('Could not read the selected file.'))
        reader.readAsText(file)
      }
      input.click()
    })
  },

  importProjectFromFile(): Promise<ProjectSpec> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type   = 'file'
      input.accept = '.json,application/json'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) { reject(new Error('No file selected')); return }
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const parsed: unknown = JSON.parse(reader.result as string)
            if (isProjectSpec(parsed)) {
              resolve(parsed)
            } else {
              reject(new Error(
                'This file does not appear to be a valid Project Spec. ' +
                'Make sure you are importing a file exported from this app.'
              ))
            }
          } catch {
            reject(new Error('The selected file is not valid JSON.'))
          }
        }
        reader.onerror = () => reject(new Error('Could not read the selected file.'))
        reader.readAsText(file)
      }
      input.click()
    })
  },
}

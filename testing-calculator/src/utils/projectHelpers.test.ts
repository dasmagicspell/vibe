import { describe, it, expect } from 'vitest'
import {
  createDefaultProject, createPageSpec, createWorkflowSpec, createIntegrationSpec,
  deriveActiveTestTypes, getTestTypeActivationReason,
  isSectionComplete, validateProject, countEffectivePages,
  intakeStepHasError, getIntakeStepErrors,
  getScheduleBlockers, canAccessSchedule,
} from './projectHelpers'
import {
  PageCategory, AccountScope, ProjectMoment, TestType,
  ALWAYS_ACTIVE_TEST_TYPES, ComplexityLevel,
} from '@/types'

// ---------------------------------------------------------------------------
// deriveActiveTestTypes
// ---------------------------------------------------------------------------

describe('deriveActiveTestTypes — always-active types', () => {
  it('includes all always-active types in a blank project', () => {
    const project = createDefaultProject()
    const types = deriveActiveTestTypes(project)
    ALWAYS_ACTIVE_TEST_TYPES.forEach(t => {
      expect(types).toContain(t)
    })
  })

  it('does not include conditional types by default', () => {
    const project = createDefaultProject()
    const types = deriveActiveTestTypes(project)
    expect(types).not.toContain(TestType.FormValidation)
    expect(types).not.toContain(TestType.RolePermission)
    expect(types).not.toContain(TestType.AnalyticsTag)
    expect(types).not.toContain(TestType.CMSAdmin)
    expect(types).not.toContain(TestType.EmailNotification)
    expect(types).not.toContain(TestType.ContentMigration)
    expect(types).not.toContain(TestType.Exploratory)
    expect(types).not.toContain(TestType.E2EAutomation)
  })
})

describe('deriveActiveTestTypes — FormValidation', () => {
  it('activates when a SimpleForm page is added', () => {
    const project = {
      ...createDefaultProject(),
      pages: [createPageSpec({ category: PageCategory.SimpleForm })],
    }
    expect(deriveActiveTestTypes(project)).toContain(TestType.FormValidation)
  })

  it('activates when a ComplexForm page is added', () => {
    const project = {
      ...createDefaultProject(),
      pages: [createPageSpec({ category: PageCategory.ComplexForm })],
    }
    expect(deriveActiveTestTypes(project)).toContain(TestType.FormValidation)
  })

  it('activates when a CheckoutPayment page is added', () => {
    const project = {
      ...createDefaultProject(),
      pages: [createPageSpec({ category: PageCategory.CheckoutPayment })],
    }
    expect(deriveActiveTestTypes(project)).toContain(TestType.FormValidation)
  })

  it('does NOT activate for purely informational pages', () => {
    const project = {
      ...createDefaultProject(),
      pages: [createPageSpec({ category: PageCategory.Informational })],
    }
    expect(deriveActiveTestTypes(project)).not.toContain(TestType.FormValidation)
  })
})

describe('deriveActiveTestTypes — RolePermission', () => {
  it('activates when accountScope is MultipleRoles', () => {
    const project = { ...createDefaultProject(), accountScope: AccountScope.MultipleRoles }
    expect(deriveActiveTestTypes(project)).toContain(TestType.RolePermission)
  })

  it('does NOT activate for BasicLogin', () => {
    const project = { ...createDefaultProject(), accountScope: AccountScope.BasicLogin }
    expect(deriveActiveTestTypes(project)).not.toContain(TestType.RolePermission)
  })
})

describe('deriveActiveTestTypes — AnalyticsTag', () => {
  it('activates when an integration has hasAnalytics = true', () => {
    const project = {
      ...createDefaultProject(),
      integrations: [createIntegrationSpec({ hasAnalytics: true })],
    }
    expect(deriveActiveTestTypes(project)).toContain(TestType.AnalyticsTag)
  })

  it('does NOT activate when no integrations have analytics', () => {
    const project = {
      ...createDefaultProject(),
      integrations: [createIntegrationSpec({ hasAnalytics: false })],
    }
    expect(deriveActiveTestTypes(project)).not.toContain(TestType.AnalyticsTag)
  })
})

describe('deriveActiveTestTypes — EmailNotification', () => {
  it('activates when there are form pages', () => {
    const project = {
      ...createDefaultProject(),
      pages: [createPageSpec({ category: PageCategory.SimpleForm })],
    }
    expect(deriveActiveTestTypes(project)).toContain(TestType.EmailNotification)
  })

  it('activates when there are workflows', () => {
    const project = {
      ...createDefaultProject(),
      workflows: [createWorkflowSpec()],
    }
    expect(deriveActiveTestTypes(project)).toContain(TestType.EmailNotification)
  })

  it('does NOT activate for informational-only projects', () => {
    const project = {
      ...createDefaultProject(),
      pages: [createPageSpec({ category: PageCategory.Informational })],
    }
    expect(deriveActiveTestTypes(project)).not.toContain(TestType.EmailNotification)
  })
})

describe('deriveActiveTestTypes — ContentMigration', () => {
  it('activates for Migration projects', () => {
    const project = { ...createDefaultProject(), projectMoment: ProjectMoment.Migration }
    expect(deriveActiveTestTypes(project)).toContain(TestType.ContentMigration)
  })

  it('does NOT activate for NewLaunch', () => {
    const project = { ...createDefaultProject(), projectMoment: ProjectMoment.NewLaunch }
    expect(deriveActiveTestTypes(project)).not.toContain(TestType.ContentMigration)
  })
})

describe('deriveActiveTestTypes — opt-in types', () => {
  it('activates Exploratory when includeExploratory is true', () => {
    const project = { ...createDefaultProject(), includeExploratory: true }
    expect(deriveActiveTestTypes(project)).toContain(TestType.Exploratory)
  })

  it('activates E2EAutomation when includeAutomation is true', () => {
    const project = { ...createDefaultProject(), includeAutomation: true }
    expect(deriveActiveTestTypes(project)).toContain(TestType.E2EAutomation)
  })

  it('activates CMSAdmin when includeCMSAdmin is true', () => {
    const project = { ...createDefaultProject(), includeCMSAdmin: true }
    expect(deriveActiveTestTypes(project)).toContain(TestType.CMSAdmin)
  })
})

// ---------------------------------------------------------------------------
// getTestTypeActivationReason
// ---------------------------------------------------------------------------

describe('getTestTypeActivationReason', () => {
  it('returns a reason for FormValidation when form pages exist', () => {
    const project = {
      ...createDefaultProject(),
      pages: [createPageSpec({ category: PageCategory.SimpleForm })],
    }
    const reason = getTestTypeActivationReason(TestType.FormValidation, project)
    expect(reason).not.toBeNull()
    expect(reason).toContain('Form pages')
  })

  it('returns null for FormValidation when no form pages exist', () => {
    const project = createDefaultProject()
    expect(getTestTypeActivationReason(TestType.FormValidation, project)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// isSectionComplete
// ---------------------------------------------------------------------------

describe('isSectionComplete', () => {
  it('section 0 (identity) is incomplete with empty names', () => {
    const project = createDefaultProject()
    expect(isSectionComplete(0, project)).toBe(false)
  })

  it('section 0 is complete when both names are filled', () => {
    const project = { ...createDefaultProject(), projectName: 'Test', clientName: 'Client' }
    expect(isSectionComplete(0, project)).toBe(true)
  })

  it('section 2 (pages) is incomplete when pages is empty', () => {
    expect(isSectionComplete(2, createDefaultProject())).toBe(false)
  })

  it('section 2 is complete when at least one page exists', () => {
    const project = { ...createDefaultProject(), pages: [createPageSpec()] }
    expect(isSectionComplete(2, project)).toBe(true)
  })

  it('all other sections are always complete (have valid defaults)', () => {
    const project = createDefaultProject()
    const otherSections = [1, 3, 4, 5, 6, 7, 8, 9]
    otherSections.forEach(s => expect(isSectionComplete(s, project)).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// validateProject
// ---------------------------------------------------------------------------

describe('validateProject', () => {
  it('fails when projectName is empty', () => {
    const project = { ...createDefaultProject(), clientName: 'Acme' }
    const result = validateProject(project)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('Project name'))).toBe(true)
  })

  it('passes with required fields and at least one page', () => {
    const project = {
      ...createDefaultProject(),
      projectName: 'Site',
      clientName:  'Acme',
      pages:       [createPageSpec({ name: 'Home' })],
    }
    const result = validateProject(project)
    expect(result.isValid).toBe(true)
  })

  it('warns when no pages are defined', () => {
    const project = { ...createDefaultProject(), projectName: 'Site', clientName: 'Acme' }
    const result = validateProject(project)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('fails when pages have no names', () => {
    const project = {
      ...createDefaultProject(),
      projectName: 'Site',
      clientName:  'Acme',
      pages:       [createPageSpec()], // name is ''
    }
    const result = validateProject(project)
    expect(result.isValid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// intakeStepHasError / getIntakeStepErrors
// ---------------------------------------------------------------------------

describe('intakeStepHasError', () => {
  it('flags identity step when names are empty', () => {
    expect(intakeStepHasError(0, createDefaultProject())).toBe(true)
  })

  it('flags pages step when no pages exist', () => {
    const project = { ...createDefaultProject(), projectName: 'Site', clientName: 'Acme' }
    expect(intakeStepHasError(2, project)).toBe(true)
  })

  it('flags pages step when a page has no name', () => {
    const project = {
      ...createDefaultProject(),
      projectName: 'Site',
      clientName:  'Acme',
      pages:       [createPageSpec()],
    }
    expect(intakeStepHasError(2, project)).toBe(true)
  })

  it('flags generate step when project validation fails', () => {
    expect(intakeStepHasError(9, createDefaultProject())).toBe(true)
  })

  it('returns ten step flags from getIntakeStepErrors', () => {
    expect(getIntakeStepErrors(createDefaultProject())).toHaveLength(10)
  })
})

// ---------------------------------------------------------------------------
// getScheduleBlockers / canAccessSchedule
// ---------------------------------------------------------------------------

describe('getScheduleBlockers', () => {
  it('requires a loaded model', () => {
    const project = { ...createDefaultProject(), projectName: 'Site', clientName: 'Acme' }
    const blockers = getScheduleBlockers(false, project)
    expect(blockers.some(b => b.includes('testing model'))).toBe(true)
    expect(canAccessSchedule(false, project)).toBe(false)
  })

  it('requires a project', () => {
    const blockers = getScheduleBlockers(true, null)
    expect(blockers).toContain('Complete the project intake form first.')
  })

  it('includes validation errors for an incomplete project', () => {
    const blockers = getScheduleBlockers(true, createDefaultProject())
    expect(blockers).toContain('Project name is required.')
    expect(canAccessSchedule(true, createDefaultProject())).toBe(false)
  })

  it('allows access when model is loaded and project is valid', () => {
    const project = {
      ...createDefaultProject(),
      projectName: 'Site',
      clientName:  'Acme',
      pages:       [createPageSpec({ name: 'Home' })],
    }
    expect(getScheduleBlockers(true, project)).toEqual([])
    expect(canAccessSchedule(true, project)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// countEffectivePages
// ---------------------------------------------------------------------------

describe('countEffectivePages', () => {
  it('counts non-template pages as 1 each', () => {
    const pages = [
      createPageSpec({ isTemplate: false }),
      createPageSpec({ isTemplate: false }),
    ]
    expect(countEffectivePages(pages)).toBe(2)
  })

  it('expands template pages by instance count', () => {
    const pages = [
      createPageSpec({ isTemplate: true, templateInstanceCount: 10 }),
      createPageSpec({ isTemplate: false }),
    ]
    expect(countEffectivePages(pages)).toBe(11)
  })

  it('returns 0 for empty list', () => {
    expect(countEffectivePages([])).toBe(0)
  })
})

// Suppress unused import warning for ComplexityLevel used in createPageSpec default
void ComplexityLevel.Medium

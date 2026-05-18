// =============================================================================
// projectHelpers.ts
// Pure functions for creating and operating on ProjectSpec data.
// No React imports — fully unit-testable.
// =============================================================================

import type { ProjectSpec, PageSpec, WorkflowSpec, IntegrationSpec } from '@/types'
import {
  SiteType, ProjectMoment, SensitiveDataLevel, PaymentScope, AccountScope,
  NotificationScope,
  RiskLevel, RigorLevel, BrowserTier, ReportingLevel, ComplexityLevel,
  PageCategory, TestType, ALWAYS_ACTIVE_TEST_TYPES,
} from '@/types'
import { generateId } from '@/utils/modelHelpers'

// ---------------------------------------------------------------------------
// Default factories
// ---------------------------------------------------------------------------

export function createDefaultProject(): ProjectSpec {
  return {
    projectName:       '',
    clientName:        '',
    createdAt:         new Date().toISOString(),
    siteType:          SiteType.Brochure,
    projectMoment:     ProjectMoment.NewLaunch,
    sensitiveData:     SensitiveDataLevel.None,
    paymentScope:        PaymentScope.None,
    accountScope:        AccountScope.None,
    notificationScope:   NotificationScope.None,
    riskLevel:           RiskLevel.Medium,
    pages:             [],
    workflows:         [],
    integrations:      [],
    rigorLevel:           RigorLevel.Standard,
    rigorCertainty:       'High',
    browserTier:          BrowserTier.Standard,
    browserTierCertainty: 'High',
    selectedTestTypes: [...ALWAYS_ACTIVE_TEST_TYPES],
    includeExploratory:   false,
    exploratoryBlockHours: undefined,
    includeAutomation:    false,
    includeCMSAdmin:      false,
    selectedDeliverables: [],
    reportingLevel:       ReportingLevel.InternalBugList,
    retestingIncluded:    true,
  }
}

/** Legacy PageCategory string values from saved project JSON */
const LEGACY_PAGE_CATEGORY: Record<string, PageCategory> = {
  'Custom workflow / Wizard': PageCategory.ComplexForm,
}

export function normalizePageCategory(category: PageCategory | string): PageCategory {
  if (Object.values(PageCategory).includes(category as PageCategory)) {
    return category as PageCategory
  }
  return LEGACY_PAGE_CATEGORY[category] ?? PageCategory.Informational
}

export function createPageSpec(overrides: Partial<PageSpec> = {}): PageSpec {
  const { category, ...rest } = overrides
  return {
    id:         generateId(),
    name:       '',
    category:   category !== undefined
      ? normalizePageCategory(category)
      : PageCategory.Informational,
    complexity:            ComplexityLevel.Medium,
    complexityCertainty:   'High',
    isTemplate: false,
    ...rest,
  }
}

export function createWorkflowSpec(overrides: Partial<WorkflowSpec> = {}): WorkflowSpec {
  return {
    id:              generateId(),
    name:            '',
    stepCount:       3,
    hasBranching:    false,
    hasPaymentStep:  false,
    complexity:            ComplexityLevel.Medium,
    complexityCertainty:   'High',
    ...overrides,
  }
}

export function createIntegrationSpec(overrides: Partial<IntegrationSpec> = {}): IntegrationSpec {
  return {
    id:           generateId(),
    name:         '',
    category:     '',
    hasAnalytics: false,
    certainty:    'High',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Conditional test-type derivation
// This is the core "intelligence" of the intake form.
// Called whenever any intake field that drives conditional types changes.
// ---------------------------------------------------------------------------

/** Page categories that inherently involve form interactions */
const FORM_DRIVEN_CATEGORIES: PageCategory[] = [
  PageCategory.SimpleForm,
  PageCategory.ComplexForm,
  PageCategory.Authentication,
  PageCategory.CheckoutPayment,
  PageCategory.ModalPopup,
  PageCategory.ReportsDynamicData,
]

/** Infer notification scope for project JSON saved before notificationScope existed */
export function inferNotificationScope(project: ProjectSpec): NotificationScope {
  if (project.notificationScope != null) return project.notificationScope
  const hasFormPages = project.pages.some(p =>
    FORM_DRIVEN_CATEGORIES.includes(p.category),
  )
  const hasWorkflows = project.workflows.length > 0
  return hasFormPages || hasWorkflows ? NotificationScope.Basic : NotificationScope.None
}

/**
 * Derives the full set of active TestTypes for a project.
 * Always-active types are always included.
 * Conditional types activate based on intake answers.
 *
 * Returns a stable-ordered array (always-active first, then conditional).
 */
export function deriveActiveTestTypes(project: ProjectSpec): TestType[] {
  const active = new Set<TestType>(ALWAYS_ACTIVE_TEST_TYPES)

  const hasFormPages = project.pages.some(p =>
    FORM_DRIVEN_CATEGORIES.includes(p.category)
  )
  const hasWorkflows  = project.workflows.length > 0

  // Form validation — any form page or workflow implies form interactions
  if (hasFormPages) active.add(TestType.FormValidation)

  // Role/permission — only when multiple user roles exist
  if (project.accountScope === AccountScope.MultipleRoles) {
    active.add(TestType.RolePermission)
  }

  // Analytics and tag — when any integration has analytics tracking
  if (project.integrations.some(i => i.hasAnalytics)) {
    active.add(TestType.AnalyticsTag)
  }

  // CMS/Admin — explicit toggle (typically WordPress admin, Shopify dashboard)
  if (project.includeCMSAdmin) active.add(TestType.CMSAdmin)

  // Email/notification — explicit scope from intake (commerce section)
  if (project.notificationScope !== NotificationScope.None) {
    active.add(TestType.EmailNotification)
  }

  // Content migration — only relevant for migration or redesign with import
  if (project.projectMoment === ProjectMoment.Migration) {
    active.add(TestType.ContentMigration)
  }

  // Exploratory — explicit opt-in
  if (project.includeExploratory) active.add(TestType.Exploratory)

  // E2E automation — explicit opt-in
  if (project.includeAutomation) active.add(TestType.E2EAutomation)

  return Array.from(active)
}

/**
 * Returns the human-readable reason a conditional test type was activated.
 * Used in the Test Types section UI to explain why each type is included.
 */
export function getTestTypeActivationReason(
  testType: TestType,
  project: ProjectSpec,
): string | null {
  const hasFormPages = project.pages.some(p => FORM_DRIVEN_CATEGORIES.includes(p.category))
  const hasWorkflows = project.workflows.length > 0

  switch (testType) {
    case TestType.FormValidation:
      return hasFormPages ? 'Form pages detected in your page list' : null
    case TestType.RolePermission:
      return project.accountScope === AccountScope.MultipleRoles
        ? 'Multiple user roles selected' : null
    case TestType.AnalyticsTag:
      return project.integrations.some(i => i.hasAnalytics)
        ? 'Analytics integration detected' : null
    case TestType.CMSAdmin:
      return project.includeCMSAdmin ? 'CMS/Admin testing enabled' : null
    case TestType.EmailNotification:
      if (project.notificationScope === NotificationScope.Extensive) {
        return 'Extensive notifications selected'
      }
      if (project.notificationScope === NotificationScope.Basic) {
        return 'Basic notifications selected'
      }
      return null
    case TestType.ContentMigration:
      return project.projectMoment === ProjectMoment.Migration
        ? 'Project moment is Migration' : null
    case TestType.Exploratory:
      return project.includeExploratory ? 'Exploratory testing opted in' : null
    case TestType.E2EAutomation:
      return project.includeAutomation ? 'E2E automation opted in' : null
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Section completion checks (used by the sidebar)
// ---------------------------------------------------------------------------

export function isSectionComplete(sectionIndex: number, draft: ProjectSpec): boolean {
  switch (sectionIndex) {
    case 0:  return draft.projectName.trim() !== '' && draft.clientName.trim() !== ''
    case 2:  return draft.pages.length > 0
    default: return true   // all other sections have valid defaults
  }
}

export function isSectionRequired(sectionIndex: number): boolean {
  return sectionIndex === 0 || sectionIndex === 2
}

// ---------------------------------------------------------------------------
// Descriptive labels for enums (used in selects and summaries)
// ---------------------------------------------------------------------------

export const PAGE_CATEGORY_DESCRIPTIONS: Record<PageCategory, string> = {
  [PageCategory.Informational]:  'Static content, no interactivity — About, FAQ, policy',
  [PageCategory.BlogArticle]:    'Content pages with tags, comments, pagination',
  [PageCategory.MediaGallery]:   'Image/video grids, carousels, lightboxes',
  [PageCategory.SimpleForm]:     'Contact, newsletter, basic survey',
  [PageCategory.ComplexForm]:    'Multi-step, conditional-field, address entry forms',
  [PageCategory.Authentication]: 'Login, register, password reset, SSO',
  [PageCategory.ProductListing]: 'Category pages, search results, filters, sorting',
  [PageCategory.ProductDetail]:  'Attribute selectors, add-to-cart, stock status',
  [PageCategory.Cart]:           'Cart review, coupon entry, quantity edit',
  [PageCategory.CheckoutPayment]:'Address, shipping, payment entry, order confirmation',
  [PageCategory.Dashboard]:           'Authenticated views, data tables, account management',
  [PageCategory.ModelessInteraction]: 'Sidebar, chat bot, instant messaging — does not block the main page',
  [PageCategory.ModalPopup]:          'Overlay dialogs — promos, newsletter signup, confirmations',
  [PageCategory.ReportsDynamicData]:  'Reports, charts, tables — filters and content load dynamically',
  [PageCategory.InteractiveGraphics]: 'Maps & location, diagrams, canvases — graphical screens that respond to user input',
}

export const ERP_INTEGRATION_CATEGORY = 'ERP (Odoo, Microsoft Dynamics)'

export const INTEGRATION_CATEGORY_OPTIONS = [
  'Analytics (GA4, GTM)',
  'CRM (HubSpot, Salesforce)',
  ERP_INTEGRATION_CATEGORY,
  'Email marketing (Mailchimp, Klaviyo)',
  'Payment gateway (Stripe, PayPal)',
  'Social media',
  'Live chat / support',
  'Search (Algolia, Elasticsearch)',
  'Shipping / logistics',
  'Custom API / webhook',
  'Other',
]

/** True when category indicates an ERP back-office integration (Odoo, Dynamics, etc.). */
export function isErpIntegrationCategory(category: string): boolean {
  const c = category.trim().toLowerCase()
  if (!c) return false
  return c.includes('erp') || c.includes('odoo') || c.includes('dynamics')
}

export function hasErpIntegration(project: ProjectSpec): boolean {
  return project.integrations.some(i => isErpIntegrationCategory(i.category))
}

export function erpIntegrationNames(project: ProjectSpec): string[] {
  return project.integrations
    .filter(i => isErpIntegrationCategory(i.category))
    .map(i => i.name.trim() || 'Unnamed ERP integration')
}

// ---------------------------------------------------------------------------
// Project validation
// ---------------------------------------------------------------------------

export interface ProjectValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateProject(project: ProjectSpec): ProjectValidationResult {
  const errors:   string[] = []
  const warnings: string[] = []

  if (!project.projectName.trim()) errors.push('Project name is required.')
  if (!project.clientName.trim())  errors.push('Client name is required.')

  if (project.pages.length === 0) {
    warnings.push('No pages defined. Add at least one page for a meaningful estimate.')
  }

  const unnamedPages = project.pages.filter(p => !p.name.trim())
  if (unnamedPages.length > 0) {
    errors.push(`${unnamedPages.length} page(s) have no name. Please name all pages.`)
  }

  const unnamedWorkflows = project.workflows.filter(w => !w.name.trim())
  if (unnamedWorkflows.length > 0) {
    errors.push(`${unnamedWorkflows.length} workflow(s) have no name. Please name all workflows.`)
  }

  return { isValid: errors.length === 0, errors, warnings }
}

/**
 * Reasons schedule generation or viewing is blocked.
 * Intake can be drafted without a model; both require a loaded model and valid project.
 */
export function getScheduleBlockers(
  modelLoaded: boolean,
  project: ProjectSpec | null,
): string[] {
  const blockers: string[] = []

  if (!modelLoaded) {
    blockers.push(
      'Import a testing model (testing-model.json) before generating or viewing a schedule.',
    )
  }

  if (!project) {
    blockers.push('Complete the project intake form first.')
    return blockers
  }

  const validation = validateProject(project)
  if (!validation.isValid) {
    blockers.push(...validation.errors)
  }

  return blockers
}

export function canAccessSchedule(
  modelLoaded: boolean,
  project: ProjectSpec | null,
): boolean {
  return getScheduleBlockers(modelLoaded, project).length === 0
}

const INTAKE_STEP_COUNT = 10

/** True when an intake wizard step is missing required data or has invalid values. */
export function intakeStepHasError(stepIndex: number, project: ProjectSpec): boolean {
  switch (stepIndex) {
    case 0:
      return !project.projectName.trim() || !project.clientName.trim()

    case 2:
      if (project.pages.length === 0) return true
      return project.pages.some(p => !p.name.trim())

    case 3:
      return project.workflows.some(w => !w.name.trim())

    case 9:
      return !validateProject(project).isValid

    default:
      return false
  }
}

/** Per-step error flags for the intake wizard bubbles (indices 0–9). */
export function getIntakeStepErrors(project: ProjectSpec): boolean[] {
  return Array.from({ length: INTAKE_STEP_COUNT }, (_, i) => intakeStepHasError(i, project))
}

// ---------------------------------------------------------------------------
// Project summary (used in Section 10)
// ---------------------------------------------------------------------------

export function countEffectivePages(pages: PageSpec[]): number {
  return pages.reduce((sum, p) => {
    if (p.isTemplate && p.templateInstanceCount) {
      return sum + p.templateInstanceCount
    }
    return sum + 1
  }, 0)
}

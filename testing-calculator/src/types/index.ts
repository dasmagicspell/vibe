// =============================================================================
// QA Estimation Calculator — Domain Types
// Single source of truth for all enums and interfaces.
// All calculation logic, UI, and services reference these types exclusively.
// =============================================================================

// ---------------------------------------------------------------------------
// Primitive building blocks
// ---------------------------------------------------------------------------

/** Three-point estimate (hours). Forms the basis of every time calculation. */
export interface TimeEstimate {
  minHours: number
  expectedHours: number
  maxHours: number
}

/** Confidence that an estimate is accurate. Determined by calibration coverage. */
export type CertaintyLevel = 'High' | 'Medium' | 'Low'

// ---------------------------------------------------------------------------
// Enums — Page Categories
// ---------------------------------------------------------------------------

export enum PageCategory {
  Informational    = 'Informational',       // About, FAQ, policy — no interactivity
  BlogArticle      = 'Blog / Article',      // Content pages with tags, comments, pagination
  MediaGallery     = 'Media gallery',       // Image/video grids, carousels, lightboxes
  SimpleForm       = 'Simple form',         // Contact, newsletter, basic survey
  ComplexForm      = 'Complex form',        // Multi-step, conditional-field, address entry
  Authentication   = 'Authentication',      // Login, register, password reset, SSO
  ProductListing   = 'Product listing (PLP)', // Category pages, search, filters, sorting
  ProductDetail    = 'Product detail (PDP)',  // Attribute selectors, add-to-cart, stock
  Cart             = 'Cart',                // Cart review, coupon entry, quantity edit
  CheckoutPayment  = 'Checkout / Payment',  // Address, shipping, payment, confirmation
  Dashboard        = 'Dashboard / Portal',  // Authenticated views, data tables, account mgmt
  CustomWorkflow   = 'Custom workflow / Wizard', // Multi-step configurators, booking, onboarding
}

// ---------------------------------------------------------------------------
// Enums — Test Types
// ---------------------------------------------------------------------------

/**
 * Columns in the output schedule matrix.
 * Conditional test types are only shown when intake answers activate them.
 * See TestTypeCondition for activation logic.
 */
export enum TestType {
  Functional        = 'Functional (manual)',
  UILayout          = 'UI / Layout',
  ContentReview     = 'Content review',
  LinkValidation    = 'Link validation',
  FormValidation    = 'Form validation',        // Conditional: forms > 0
  RolePermission    = 'Role / Permission',      // Conditional: accounts = MultipleRoles
  CrossBrowser      = 'Cross-browser',
  ResponsiveMobile  = 'Responsive / Mobile',
  Accessibility     = 'Accessibility (WCAG)',
  Performance       = 'Performance (basic)',
  SEOMeta           = 'SEO / Meta',
  SecurityPrivacy   = 'Security / Privacy',
  AnalyticsTag      = 'Analytics and tag',      // Conditional: has analytics integration
  CMSAdmin          = 'CMS / Admin',            // Conditional: CMS admin in scope
  EmailNotification = 'Email / Notification',   // Conditional: forms or workflows > 0
  ContentMigration  = 'Content migration',      // Conditional: project moment = Migration
  Exploratory       = 'Exploratory',            // Conditional: explicitly selected
  E2EAutomation     = 'E2E automation',         // Conditional: explicitly selected
}

/** Which test types are always shown vs. conditionally activated */
export const ALWAYS_ACTIVE_TEST_TYPES: TestType[] = [
  TestType.Functional,
  TestType.UILayout,
  TestType.ContentReview,
  TestType.LinkValidation,
  TestType.CrossBrowser,
  TestType.ResponsiveMobile,
  TestType.Accessibility,
  TestType.Performance,
  TestType.SEOMeta,
  TestType.SecurityPrivacy,
]

export const CONDITIONAL_TEST_TYPES: TestType[] = [
  TestType.FormValidation,
  TestType.RolePermission,
  TestType.AnalyticsTag,
  TestType.CMSAdmin,
  TestType.EmailNotification,
  TestType.ContentMigration,
  TestType.Exploratory,
  TestType.E2EAutomation,
]

// ---------------------------------------------------------------------------
// Enums — Complexity, Rigor, Browser Tier
// ---------------------------------------------------------------------------

export enum ComplexityLevel {
  Low    = 'Low',    // Static content, no interactivity, no API calls
  Medium = 'Medium', // 1-2 interactions or API calls, standard forms
  High   = 'High',   // Multi-step workflow, integrations, dynamic state
}

/** Tooltip definitions shown to both engineer and account manager. */
export const COMPLEXITY_DEFINITIONS: Record<ComplexityLevel, string> = {
  [ComplexityLevel.Low]:
    'Static content, no interactivity, no API calls. Example: an About page or a simple FAQ.',
  [ComplexityLevel.Medium]:
    '1–2 user interactions or API calls, standard forms, typical Shopify product page.',
  [ComplexityLevel.High]:
    'Multi-step workflow, third-party integrations, dynamic state management, or custom checkout logic.',
}

export enum RigorLevel {
  Smoke    = 'Smoke',     // Happy path only — is it basically working?
  Standard = 'Standard',  // Functional + edge cases + cross-browser
  Enhanced = 'Enhanced',  // Standard + accessibility + performance + deeper exploration
  Audit    = 'Audit',     // Full documented test pass, client-ready evidence
}

export const RIGOR_DEFINITIONS: Record<RigorLevel, string> = {
  [RigorLevel.Smoke]:
    'Happy-path check only. Quick confidence that core functionality is not broken.',
  [RigorLevel.Standard]:
    'Functional testing plus key edge cases and cross-browser checks. Most projects.',
  [RigorLevel.Enhanced]:
    'Standard plus accessibility, performance, deeper exploration, and validation coverage.',
  [RigorLevel.Audit]:
    'Full documented test pass with client-ready evidence and formal sign-off artifacts.',
}

export enum BrowserTier {
  Basic    = 'Basic',    // Chrome desktop + mobile viewport simulation
  Standard = 'Standard', // Chrome, Safari, Edge + iPhone/Android/tablet viewports
  Enhanced = 'Enhanced', // Standard + Firefox + real-device spot checks
  Custom   = 'Custom',   // Defined by client analytics or contractual requirement
}

export const BROWSER_TIER_DEFINITIONS: Record<BrowserTier, string> = {
  [BrowserTier.Basic]:
    'Chrome desktop + mobile viewport simulation only.',
  [BrowserTier.Standard]:
    'Chrome, Safari, Edge + iPhone, Android, and tablet viewport simulation.',
  [BrowserTier.Enhanced]:
    'Standard tier + Firefox + real-device spot checks.',
  [BrowserTier.Custom]:
    'Defined by client analytics or contractual requirement. Specify below.',
}

// ---------------------------------------------------------------------------
// Enums — Site & Project Context
// ---------------------------------------------------------------------------

export enum SiteType {
  Brochure    = 'Brochure',         // Marketing site, minimal interactivity
  Nonprofit   = 'Nonprofit',        // Donation flows, event listings, volunteer forms
  Ecommerce   = 'E-commerce',       // Products, cart, checkout
  Portal      = 'Portal',           // Authenticated user dashboard or client portal
  WorkflowApp = 'Workflow app',     // Custom multi-step processes, configurators
}

export enum ProjectMoment {
  NewLaunch   = 'New launch',       // First release
  Redesign    = 'Redesign',         // Existing site with visual or structural overhaul
  Maintenance = 'Maintenance',      // Ongoing updates to live site
  BugFix      = 'Bug fix',          // Targeted fix for known issue(s)
  Migration   = 'Migration',        // Content or platform migration
}

export enum SensitiveDataLevel {
  None         = 'None',
  ContactInfo  = 'Contact information',
  Payment      = 'Payment data',
  HealthLegal  = 'Health, legal, or financial data',
}

export enum PaymentScope {
  None            = 'None',
  SimpleCheckout  = 'Simple checkout',
  Subscriptions   = 'Subscriptions',
  FullEcommerce   = 'Shipping, tax, coupons, and complex rules',
}

export enum AccountScope {
  None          = 'None',
  BasicLogin    = 'Basic login / register',
  MultipleRoles = 'Multiple user roles or permissions',
}

export enum RiskLevel {
  Low    = 'Low',
  Medium = 'Medium',
  High   = 'High',
}

export enum ReportingLevel {
  InternalBugList = 'Internal bug list',
  ClientSummary   = 'Client-facing summary',
  FormalQAReport  = 'Formal QA report',
}

/** Engineer's experience-based estimate of typical defect/churn rate on a project */
export enum DefectDensity {
  Low    = 'Low',    // ~10% retesting overhead — stable codebase, experienced devs
  Medium = 'Medium', // ~20% retesting overhead — typical project
  High   = 'High',   // ~35% retesting overhead — volatile codebase, rapid changes
}

export const DEFECT_DENSITY_DEFINITIONS: Record<DefectDensity, string> = {
  [DefectDensity.Low]:
    'Low churn expected. Stable codebase, experienced development team. ~10% retesting overhead.',
  [DefectDensity.Medium]:
    'Typical project. Some bugs will require retesting and light regression. ~20% overhead.',
  [DefectDensity.High]:
    'High churn expected. Volatile codebase or rapid iteration. ~35% retesting overhead.',
}

// Retesting overhead multipliers keyed by DefectDensity
export const DEFECT_DENSITY_MULTIPLIERS: Record<DefectDensity, number> = {
  [DefectDensity.Low]:    0.10,
  [DefectDensity.Medium]: 0.20,
  [DefectDensity.High]:   0.35,
}

// Rigor multipliers applied to base estimates
export const RIGOR_MULTIPLIERS: Record<RigorLevel, number> = {
  [RigorLevel.Smoke]:    0.50,
  [RigorLevel.Standard]: 1.00,
  [RigorLevel.Enhanced]: 1.50,
  [RigorLevel.Audit]:    2.20,
}

// Complexity multipliers applied to base estimates
export const COMPLEXITY_MULTIPLIERS: Record<ComplexityLevel, number> = {
  [ComplexityLevel.Low]:    1.0,
  [ComplexityLevel.Medium]: 1.4,
  [ComplexityLevel.High]:   2.0,
}

// ---------------------------------------------------------------------------
// Deliverable Types (appear as line items in the summary section)
// ---------------------------------------------------------------------------

export enum DeliverableType {
  TestPlanMatrix  = 'Test plan / matrix creation',
  UATSupport      = 'UAT support',
  FinalQAReport   = 'Final QA report',
}

// ---------------------------------------------------------------------------
// Calibration Model (set by the Test Engineer)
// ---------------------------------------------------------------------------

/**
 * A single calibration data point.
 * When pageCategory is undefined, this is a BASE RATE that applies to all page
 * categories as a fallback. When pageCategory is set, it is a category-specific
 * override. The calculation engine checks for specific matches first, then
 * falls back to base rates, degrading certainty accordingly.
 */
export interface CalibrationEntry {
  id: string
  pageCategory?: PageCategory   // undefined = base rate for all categories
  testType: TestType
  complexity: ComplexityLevel
  /** Baseline estimate at RigorLevel.Standard */
  baseEstimate: TimeEstimate
  notes?: string
}

/** Browser-tier-specific calibration for cross-browser testing */
export interface BrowserCalibrationEntry {
  tier: BrowserTier
  /** Per-page estimate at Standard rigor */
  estimatePerPage: TimeEstimate
}

/** Overhead factors set by the engineer, applied to every project */
export interface OverheadFactors {
  /** Planning and coordination as a decimal fraction of execution hours, e.g. 0.12 */
  coordinationFraction: number
  /** Reporting effort as a decimal fraction of execution hours, e.g. 0.15 */
  reportingFraction: number
  /** Typical defect/churn rate for retesting estimates */
  defaultDefectDensity: DefectDensity
}

/** Deliverable time estimates set by the engineer during calibration */
export interface DeliverableEstimate {
  type: DeliverableType
  estimate: TimeEstimate
  notes?: string
}

/** Exploratory testing block sizes available to the account manager */
export interface ExploratoryBlock {
  label: string   // e.g. "2-hour block", "Half-day block"
  hours: number
}

/**
 * The complete testing model produced by the engineer.
 * Saved as testing-model.json and shared via Teams folder.
 */
export interface TestingModel {
  /** Semantic version — increment when calibration entries change materially */
  version: string
  engineerName: string
  calibratedAt: string   // ISO 8601 date string
  entries: CalibrationEntry[]
  browserCalibration: BrowserCalibrationEntry[]
  overheadFactors: OverheadFactors
  deliverableEstimates: DeliverableEstimate[]
  exploratoryBlocks: ExploratoryBlock[]
  notes?: string
}

// ---------------------------------------------------------------------------
// Project Spec (set by the Account Manager)
// ---------------------------------------------------------------------------

/** A page in the site being tested */
export interface PageSpec {
  id: string
  name: string
  category: PageCategory
  complexity: ComplexityLevel
  /** True if this page is one template used for many similar pages (e.g. blog post) */
  isTemplate: boolean
  /** Number of instances if isTemplate = true */
  templateInstanceCount?: number
  notes?: string
}

/** A workflow (may span multiple pages / states) */
export interface WorkflowSpec {
  id: string
  name: string
  /** Approximate number of distinct steps */
  stepCount: number
  hasBranching: boolean
  hasPaymentStep: boolean
  complexity: ComplexityLevel
  notes?: string
}

/** An external integration */
export interface IntegrationSpec {
  id: string
  name: string
  /** e.g. CRM, analytics, payment gateway, email, webhook, custom API */
  category: string
  hasAnalytics: boolean
}

/**
 * Everything the account manager specifies about a project.
 * This is the input to the calculation engine.
 */
export interface ProjectSpec {
  // Identity
  projectName: string
  clientName: string
  createdAt: string   // ISO 8601

  // Site profile
  siteType: SiteType
  projectMoment: ProjectMoment
  sensitiveData: SensitiveDataLevel
  paymentScope: PaymentScope
  accountScope: AccountScope
  riskLevel: RiskLevel

  // Dimensions
  pages: PageSpec[]
  workflows: WorkflowSpec[]
  integrations: IntegrationSpec[]

  // Testing parameters
  rigorLevel: RigorLevel
  browserTier: BrowserTier
  customBrowserDescription?: string
  selectedTestTypes: TestType[]    // always-active types + any conditional ones triggered

  // Explicit selections for conditional types
  includeExploratory: boolean
  exploratoryBlockHours?: number
  includeAutomation: boolean
  includeCMSAdmin: boolean

  // Deliverables
  selectedDeliverables: DeliverableType[]

  // Reporting
  reportingLevel: ReportingLevel
  retestingIncluded: boolean

  // Override default defect density for this project
  defectDensityOverride?: DefectDensity

  notes?: string
}

// ---------------------------------------------------------------------------
// Schedule Output
// ---------------------------------------------------------------------------

/** A test case contributing to one matrix cell */
export interface TestCase {
  id: string
  description: string
  estimatedMinutes?: number
}

/**
 * One cell in the output matrix: a page/workflow row × a test type column.
 * null means this combination is not applicable for this project.
 */
export interface ScheduleCell {
  rowId: string
  testType: TestType
  estimate: TimeEstimate
  certainty: CertaintyLevel
  /** The test cases that make up this estimate (shown on drill-down) */
  testCases: TestCase[]
  /** True if this cell needs review because it was interpolated or inferred */
  needsReview: boolean
}

/** One row in the schedule matrix (a page or workflow) */
export interface ScheduleRow {
  id: string
  label: string
  rowType: 'page' | 'workflow'
  /** Row subtotal across all active test types */
  subtotal: TimeEstimate
  cells: Record<string, ScheduleCell>   // keyed by TestType
}

/** Line item in the summary section below the matrix */
export interface SummaryLineItem {
  label: string
  estimate: TimeEstimate
  certainty: CertaintyLevel
  isBold?: boolean
  tooltip?: string
}

/**
 * Complete schedule output produced by the calculation engine.
 * This is what gets displayed and printed.
 */
export interface ScheduleOutput {
  projectName: string
  clientName: string
  generatedAt: string   // ISO 8601
  engineerName: string
  modelVersion: string
  rigorLevel: RigorLevel
  browserTier: BrowserTier

  activeTestTypes: TestType[]
  rows: ScheduleRow[]

  /** Execution subtotal (matrix sum) */
  executionSubtotal: TimeEstimate

  /** Retesting + regression line items */
  retestingEstimate: TimeEstimate
  regressionEstimate: TimeEstimate

  /** Overhead line items */
  coordinationOverhead: TimeEstimate
  reportingOverhead: TimeEstimate

  /** Deliverable line items */
  deliverableLineItems: SummaryLineItem[]

  /** Grand total — everything included */
  grandTotal: TimeEstimate

  /** Cells flagged for engineer review (low-certainty interpolations) */
  reviewFlags: Array<{ rowLabel: string; testType: TestType; reason: string }>
}

// ---------------------------------------------------------------------------
// Client-Facing Scope Document (auto-populated from ProjectSpec + ScheduleOutput)
// ---------------------------------------------------------------------------

export interface ScopeDocSection {
  heading: string
  items: string[]
  editable: boolean
}

export interface ClientScopeDoc {
  projectName: string
  clientName: string
  preparedBy: string
  preparedAt: string
  sections: {
    whatWeWillTest: ScopeDocSection
    whatWeWillNotTest: ScopeDocSection
    whatWeNeedFromYou: ScopeDocSection
    deliverables: ScopeDocSection
    assumptions: ScopeDocSection
    changeTriggers: ScopeDocSection
    optionalAddOns: ScopeDocSection
  }
}

// ---------------------------------------------------------------------------
// Application State
// ---------------------------------------------------------------------------

export type AppRole = 'engineer' | 'manager' | null

export interface AppState {
  role: AppRole
  model: TestingModel | null
  project: ProjectSpec | null
  schedule: ScheduleOutput | null
  scopeDoc: ClientScopeDoc | null
  /** True if the model has been modified since last save */
  modelDirty: boolean
  /** True if the project has been modified since last save */
  projectDirty: boolean
}

// ---------------------------------------------------------------------------
// Storage keys (used by StorageService)
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  MODEL:        'apf_qacalc_model_v1',
  PROJECT:      'apf_qacalc_project_v1',
  DRAFT_MODEL:  'apf_qacalc_draft_model_v1',
} as const

// ---------------------------------------------------------------------------
// UI display helpers
// ---------------------------------------------------------------------------

/** Short description of each test type — shown in the calibration wizard */
export const TEST_TYPE_DESCRIPTIONS: Record<TestType, string> = {
  [TestType.Functional]:        'Features work as specified — happy path and key error states',
  [TestType.UILayout]:          'Visual correctness, spacing, typography, responsive breakpoints',
  [TestType.ContentReview]:     'Copy accuracy, images load, no placeholder text, locale correctness',
  [TestType.LinkValidation]:    'Internal/external links, 404s, redirect chains',
  [TestType.FormValidation]:    'Required fields, error messages, submission behaviour, edge cases',
  [TestType.RolePermission]:    'Access control — correct content and actions per user role',
  [TestType.CrossBrowser]:      'Chrome, Safari, Firefox, Edge — per the selected browser tier',
  [TestType.ResponsiveMobile]:  'Key breakpoints on real or emulated devices',
  [TestType.Accessibility]:     'Keyboard nav, screen reader, colour contrast, ARIA labels',
  [TestType.Performance]:       'Lighthouse score, page weight, image optimisation',
  [TestType.SEOMeta]:           'Title tags, descriptions, OG tags, sitemap, robots.txt',
  [TestType.SecurityPrivacy]:   'Cookie consent, HTTPS, form data handling, privacy policy',
  [TestType.AnalyticsTag]:      'GTM, GA4, conversion pixels — fire correctly on key events',
  [TestType.CMSAdmin]:          'WordPress admin, Shopify dashboard, custom CMS backend',
  [TestType.EmailNotification]: 'Transactional emails, confirmations, admin alerts',
  [TestType.ContentMigration]:  'Content imported correctly — no missing, truncated, or corrupt data',
  [TestType.Exploratory]:       'Fixed-time expert exploration — unscripted, experience-driven',
  [TestType.E2EAutomation]:     'Automated test authoring and execution (line-item total)',
}

// =============================================================================
// testCases.ts
// Default and model-backed representative test case descriptions per test type.
// Used by the calculation engine to populate ScheduleCell.testCases[].
// =============================================================================

import type { TestCase, TestingModel } from '@/types'
import { TestType } from '@/types'

function newId(): string {
  return crypto.randomUUID()
}

function tc(description: string): TestCase {
  return { id: newId(), description }
}

// ---------------------------------------------------------------------------
// Base test cases per test type (seed defaults for new models)
// ---------------------------------------------------------------------------

const BASE_TEST_CASES: Record<TestType, TestCase[]> = {
  [TestType.Functional]: [
    tc('Happy path works end-to-end without errors'),
    tc('Key error states display clear, specific messages'),
    tc('Navigation and internal links work as expected'),
    tc('Page behaves correctly after browser refresh'),
    tc('Loading and empty states handled gracefully'),
    tc('Feature state is consistent across actions'),
  ],
  [TestType.UILayout]: [
    tc('Visual design matches approved mockup or design spec'),
    tc('Typography (size, weight, line-height, spacing) consistent'),
    tc('All interactive elements have visible hover and focus states'),
    tc('No text overflow, clipping, or unintended line wrapping'),
    tc('Spacing and alignment consistent with design system'),
    tc('Images and media render at correct aspect ratio'),
  ],
  [TestType.ContentReview]: [
    tc('All body copy is accurate, proofread, and grammatically correct'),
    tc('No placeholder text remains (Lorem ipsum, TODO, FIXME)'),
    tc('All images have appropriate alt text'),
    tc('Dates, names, phone numbers, and prices are correct'),
    tc('Legal/compliance copy (T&Cs, privacy, cookies) is current'),
  ],
  [TestType.LinkValidation]: [
    tc('All internal navigation links route to the correct page'),
    tc('All external links open correctly (new tab where required)'),
    tc('No 404 errors on any linked page'),
    tc('No redirect chains longer than two hops'),
    tc('Anchor links (#section) scroll to the correct target'),
    tc('Footer and header links are consistent across pages'),
  ],
  [TestType.FormValidation]: [
    tc('Required field validation fires on submit with clear error messages'),
    tc('Email fields reject invalid formats and accept valid ones'),
    tc('Character limits enforced and communicated to the user'),
    tc('Success state displays correctly after valid submission'),
    tc('Form cannot be submitted twice (double-submit protection)'),
    tc('Form data is cleared or preserved correctly after submission'),
    tc('Tab order is logical for keyboard users'),
  ],
  [TestType.RolePermission]: [
    tc('Each role can access only its permitted pages and features'),
    tc('Unauthorised direct-URL access redirects appropriately'),
    tc('Admin-only actions are hidden from lower-privilege roles'),
    tc('Sensitive data (e.g. order details, PII) masked for unauthorised roles'),
    tc('Role-switching (if supported) updates permissions correctly'),
  ],
  [TestType.CrossBrowser]: [
    tc('All functionality works correctly in target browsers'),
    tc('Visual layout consistent across target browsers'),
    tc('JavaScript features work in all target browsers'),
    tc('Fonts render acceptably across browsers'),
    tc('Form submission and validation work across browsers'),
  ],
  [TestType.ResponsiveMobile]: [
    tc('Layout adapts correctly at each target breakpoint'),
    tc('No horizontal scrollbar on any mobile viewport'),
    tc('Touch targets large enough (minimum 44×44 px)'),
    tc('Images and media scale to fit viewport'),
    tc('Navigation is usable on small screens (hamburger, drawer, etc.)'),
    tc('Forms are usable on touch devices'),
  ],
  [TestType.Accessibility]: [
    tc('Full keyboard navigation works without a mouse'),
    tc('Focus indicators visible on all interactive elements'),
    tc('Screen reader announces content in a meaningful order'),
    tc('Text contrast meets WCAG AA (4.5:1 for body text, 3:1 for UI)'),
    tc('Images have appropriate alt text or are marked decorative'),
    tc('Form inputs have correctly associated labels'),
    tc('No keyboard traps — focus can always exit interactive elements'),
  ],
  [TestType.Performance]: [
    tc('Lighthouse performance score meets agreed target'),
    tc('Largest Contentful Paint (LCP) under 2.5 seconds on 4G'),
    tc('Cumulative Layout Shift (CLS) under 0.1'),
    tc('Images served in modern formats (WebP/AVIF) and appropriately sized'),
    tc('No render-blocking scripts in the critical path'),
  ],
  [TestType.SEOMeta]: [
    tc('Page title is unique, descriptive, and under 60 characters'),
    tc('Meta description present and between 120–160 characters'),
    tc('Open Graph (og:title, og:image, og:description) tags present'),
    tc('One H1 per page; heading hierarchy (H1→H2→H3) is logical'),
    tc('Page is included in XML sitemap'),
    tc('robots.txt does not inadvertently block indexing'),
    tc('Canonical URL tag set correctly'),
  ],
  [TestType.SecurityPrivacy]: [
    tc('Cookie consent banner appears before any non-essential cookies fire'),
    tc('Accepting/declining cookies functions and persists across sessions'),
    tc('All pages served over HTTPS; HTTP redirects to HTTPS'),
    tc('Sensitive data (emails, names) not visible in URL parameters'),
    tc('Privacy policy linked in footer and is current'),
    tc('Contact and lead-capture forms include GDPR/privacy notice where required'),
  ],
  [TestType.AnalyticsTag]: [
    tc('Page view event fires correctly on page load'),
    tc('Key conversion events fire at the right moments'),
    tc('Tag Manager container loads and fires without console errors'),
    tc('No duplicate tags firing on a single page view'),
    tc('Data layer populated with correct values before tags fire'),
    tc('Events verified in analytics platform debug view'),
  ],
  [TestType.CMSAdmin]: [
    tc('Content can be created, saved, and published from the CMS'),
    tc('Media (images, documents) can be uploaded and attached to content'),
    tc('CMS user permissions match assigned roles'),
    tc('Scheduled publishing works at the correct time'),
    tc('Draft/preview mode shows content correctly before publish'),
  ],
  [TestType.EmailNotification]: [
    tc('Confirmation emails delivered within expected time window'),
    tc('Email subject lines and body copy are correct'),
    tc('HTML email renders acceptably in major email clients'),
    tc('Unsubscribe links function and update preferences'),
    tc('Admin notification emails received by correct recipients'),
    tc('Transactional emails fire for correct triggering actions only'),
  ],
  [TestType.ContentMigration]: [
    tc('All content items migrated with no data loss'),
    tc('Text formatting preserved correctly from source system'),
    tc('Media files (images, PDFs) accessible at new URLs'),
    tc('Internal links updated to new URL structure'),
    tc('Metadata (dates, authors, categories) migrated accurately'),
    tc('Redirects in place from old URLs to new URLs'),
  ],
  [TestType.Exploratory]: [
    tc('Expert-driven unscripted testing of high-risk user journeys'),
    tc('Edge cases and unusual user behaviour explored'),
    tc('Integration touchpoints tested for unexpected failures'),
    tc('Session charter documented with findings and anomalies'),
  ],
  [TestType.E2EAutomation]: [
    tc('Automated test suite covers critical happy-path flows'),
    tc('Tests run reliably in CI/CD pipeline'),
    tc('Test results reported clearly with failure screenshots'),
    tc('Automation coverage documented in test plan'),
  ],
}

function cloneTestCases(cases: TestCase[]): TestCase[] {
  return cases.map(c => ({
    id: newId(),
    description: c.description,
    ...(c.estimatedMinutes !== undefined ? { estimatedMinutes: c.estimatedMinutes } : {}),
  }))
}

/** Fresh copy of base representative cases for every test type (new IDs). */
export function createDefaultRepresentativeTestCases(): Record<TestType, TestCase[]> {
  const result = {} as Record<TestType, TestCase[]>
  for (const testType of Object.values(TestType)) {
    result[testType] = cloneTestCases(BASE_TEST_CASES[testType] ?? [])
  }
  return result
}

/** Merge loaded cases with defaults; missing test types get base seeds. */
export function normalizeRepresentativeTestCases(
  raw?: Partial<Record<TestType, TestCase[]>>,
): Record<TestType, TestCase[]> {
  const defaults = createDefaultRepresentativeTestCases()
  if (!raw) return defaults

  const result = { ...defaults }
  for (const testType of Object.values(TestType)) {
    const cases = raw[testType]
    if (cases !== undefined) {
      result[testType] = cases.map(c => ({
        id: c.id || newId(),
        description: c.description ?? '',
        ...(c.estimatedMinutes !== undefined ? { estimatedMinutes: c.estimatedMinutes } : {}),
      }))
    }
  }
  return result
}

/** Representative cases for a test type from the engineer's model. */
export function getRepresentativeTestCases(
  model: TestingModel,
  testType: TestType,
): TestCase[] {
  return model.representativeTestCases[testType] ?? []
}

// =============================================================================
// testCases.ts
// Generates representative test case descriptions for each test type.
// Used by the calculation engine to populate ScheduleCell.testCases[].
// Each test case is shown in the drill-down modal when a matrix cell is clicked.
// =============================================================================

import type { TestCase } from '@/types'
import { TestType, PageCategory } from '@/types'
import { generateId } from '@/utils/modelHelpers'

function tc(description: string): TestCase {
  return { id: generateId(), description }
}

// ---------------------------------------------------------------------------
// Base test cases per test type (always included)
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

// ---------------------------------------------------------------------------
// Page-category–specific additional test cases (appended to base list)
// ---------------------------------------------------------------------------

const CATEGORY_EXTRA_CASES: Partial<Record<PageCategory, Partial<Record<TestType, TestCase[]>>>> = {
  [PageCategory.CheckoutPayment]: {
    [TestType.Functional]: [
      tc('Valid payment card processes and order is confirmed'),
      tc('Declined card shows appropriate error without losing cart'),
      tc('Order confirmation email and order ID received'),
      tc('Stock quantity decrements after successful purchase'),
    ],
    [TestType.SecurityPrivacy]: [
      tc('Payment form uses secure payment provider iframe (no raw card data in DOM)'),
      tc('CVV field cleared after submission attempt'),
    ],
  },
  [PageCategory.Authentication]: {
    [TestType.Functional]: [
      tc('Valid credentials log the user in and redirect correctly'),
      tc('Invalid credentials show error without revealing which field is wrong'),
      tc('Password reset email received and link is valid for correct time window'),
      tc('Session expires after inactivity and prompts re-authentication'),
    ],
  },
  [PageCategory.SimpleForm]: {
    [TestType.FormValidation]: [
      tc('Honeypot or CAPTCHA prevents obvious spam submission'),
      tc('Submitted data appears correctly in the admin notification email'),
    ],
  },
  [PageCategory.ComplexForm]: {
    [TestType.FormValidation]: [
      tc('Conditional fields show/hide based on previous answers'),
      tc('Partial progress is preserved if user navigates back'),
      tc('Multi-step form summary is accurate before final submit'),
    ],
  },
  [PageCategory.ProductDetail]: {
    [TestType.Functional]: [
      tc('Attribute combination (size + colour) updates price and stock correctly'),
      tc('"Add to cart" button reflects correct selected variant'),
      tc('Out-of-stock state disables purchase correctly'),
    ],
  },
  [PageCategory.Dashboard]: {
    [TestType.Functional]: [
      tc("Data displayed is scoped to the authenticated user's account"),
      tc('Filtering and sorting controls work correctly'),
      tc('Pagination or infinite scroll works at volume'),
    ],
  },
  [PageCategory.ModalPopup]: {
    [TestType.Functional]: [
      tc('Modal opens and closes via trigger, close control, and Escape key'),
      tc('Focus is trapped inside the modal while open and returns on close'),
      tc('Background content is not interactable while modal is open'),
    ],
  },
  [PageCategory.ModelessInteraction]: {
    [TestType.Functional]: [
      tc('Widget opens, minimizes, and closes without blocking main page interaction'),
      tc('Messages or actions in the widget persist correctly across navigation'),
    ],
  },
  [PageCategory.ReportsDynamicData]: {
    [TestType.Functional]: [
      tc('Filters and date ranges update displayed data correctly'),
      tc('Empty, loading, and error states render appropriately'),
      tc('Export or print (if present) matches on-screen data'),
    ],
  },
  [PageCategory.InteractiveGraphics]: {
    [TestType.Functional]: [
      tc('Map or canvas loads and pans/zooms correctly'),
      tc('Location search or geolocation returns relevant results'),
      tc('Selected pin, region, or graphic element updates related detail correctly'),
    ],
  },
}

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

/**
 * Returns the list of test cases for a cell in the schedule matrix.
 * Starts with base test cases for the test type,
 * then appends any page-category-specific extras.
 */
export function getTestCases(testType: TestType, pageCategory?: PageCategory): TestCase[] {
  const base = BASE_TEST_CASES[testType] ?? []
  if (!pageCategory) return base

  const extras = CATEGORY_EXTRA_CASES[pageCategory]?.[testType] ?? []
  return [...base, ...extras]
}

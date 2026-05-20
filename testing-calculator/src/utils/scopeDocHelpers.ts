// =============================================================================
// scopeDocHelpers.ts
// Pure functions that build a ClientScopeDoc from a ProjectSpec + ScheduleOutput.
// The account manager can then edit each section before printing.
// =============================================================================

import type { ClientScopeDoc, ProjectSpec, ScheduleOutput } from '@/types'
import {
  TestType, AccountScope, PaymentScope, NotificationScope, ProjectMoment,
  CONDITIONAL_TEST_TYPES, TEST_TYPE_DESCRIPTIONS,
  RigorLevel, BrowserTier,
  RIGOR_DEFINITIONS, BROWSER_TIER_DEFINITIONS,
} from '@/types'
import {
  countEffectivePages, erpIntegrationNames, hasErpIntegration,
} from '@/utils/projectHelpers'
import { formatRange } from '@/utils/modelHelpers'

const PREPARED_BY = 'A Positive Future'

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildWillTest(project: ProjectSpec, output: ScheduleOutput): string[] {
  const items = output.activeTestTypes.map(tt =>
    `${tt} — ${TEST_TYPE_DESCRIPTIONS[tt]}`
  )

  const pageCount = project.pages.length
  const workflowCount = project.workflows.length
  const integrationCount = project.integrations.length

  if (pageCount > 0 || workflowCount > 0 || integrationCount > 0) {
    const parts: string[] = []
    if (pageCount > 0) parts.push(`${pageCount} page${pageCount !== 1 ? 's' : ''}`)
    if (workflowCount > 0) parts.push(`${workflowCount} workflow${workflowCount !== 1 ? 's' : ''}`)
    if (integrationCount > 0) {
      const names = project.integrations
        .map(i => i.name.trim() || 'Unnamed integration')
        .join(', ')
      parts.push(`${integrationCount} integration${integrationCount !== 1 ? 's' : ''} (${names})`)
    }
    items.unshift(
      `Estimation matrix coverage: ${parts.join(', ')} — each row × test type in the internal schedule`,
    )
  }

  return items
}

function buildWillNotTest(project: ProjectSpec, output: ScheduleOutput): string[] {
  const active = new Set(output.activeTestTypes)

  // Conditional types that were not activated
  const notActivated = CONDITIONAL_TEST_TYPES
    .filter(tt => !active.has(tt))
    .filter(tt => tt !== TestType.E2EAutomation) // shown in add-ons instead
    .map(tt => `${tt} (condition not met for this project)`)

  const standard = [
    'Penetration testing or security vulnerability scanning',
    'Load testing, stress testing, or performance benchmarking beyond Lighthouse',
    'Backend server infrastructure or DevOps configuration',
    'Browser versions not listed in the agreed browser tier',
    'Third-party service uptime (payment gateways, CRM, analytics platforms)',
  ]

  if (hasErpIntegration(project)) {
    standard.push(
      'Odoo/ERP platform administration, custom module development, or ERP hosting configuration',
    )
  }

  return [...notActivated, ...standard]
}

function buildNeededFromYou(project: ProjectSpec): string[] {
  const items: string[] = [
    'Access to the staging or test environment (URL + any basic-auth credentials)',
    'Confirmation of the content freeze date — content changes during testing require re-testing',
    'A named point of contact available for questions during the testing period',
  ]

  if (project.accountScope !== AccountScope.None) {
    items.push('Test user accounts with login credentials for each distinct user role')
  }

  if (project.paymentScope !== PaymentScope.None) {
    items.push('Test credit card numbers approved by the payment provider for sandbox use')
  }

  if (project.notificationScope !== NotificationScope.None) {
    items.push(
      'Access to a test inbox, SMS sandbox, or notification log for verifying outbound messages',
    )
    if (project.notificationScope === NotificationScope.Extensive) {
      items.push('Documentation of notification channels, triggers, and expected recipient lists')
    }
  }

  if (project.integrations.some(i => i.hasAnalytics)) {
    items.push('Analytics measurement plan or tag specification document')
  }

  if (hasErpIntegration(project)) {
    items.push(
      'Odoo or ERP sandbox/staging access with a test company and representative products, customers, and orders',
    )
    items.push(
      'Documentation of data synced between the website and ERP (catalog, inventory, orders, contacts) and expected update timing',
    )
    items.push('API, webhook, or connector credentials for the ERP integration (staging environment only)')
  }

  if (project.includeCMSAdmin) {
    items.push('CMS admin credentials for backend dashboard testing')
  }

  if (project.projectMoment === ProjectMoment.Migration) {
    items.push('Access to the source system or a complete content export for comparison')
    items.push('URL mapping document listing old URLs and their corresponding new URLs')
  }

  if (project.workflows.some(w => w.hasPaymentStep)) {
    items.push('Sample orders or booking data for end-to-end workflow testing')
  }

  items.push('Sign-off on this scope document before testing begins')

  return items
}

function buildDeliverables(output: ScheduleOutput, retestingIncluded: boolean): string[] {
  const items: string[] = [
    'Bug report: all issues logged with severity (Critical / High / Medium / Low), steps to reproduce, and screenshots',
  ]

  for (const d of output.deliverableLineItems) {
    items.push(`${d.label} (estimated ${formatRange(d.estimate)})`)
  }

  if (retestingIncluded) {
    items.push('Retesting pass: confirmation that reported bugs have been fixed')
    items.push('Regression check: verification that bug fixes have not introduced new issues')
  }

  return items
}

function buildAssumptions(project: ProjectSpec, output: ScheduleOutput): string[] {
  const effectivePages = countEffectivePages(project.pages)
  const erpNames = erpIntegrationNames(project)

  return [
    `Testing environment: staging (not production)`,
    `Pages in scope: ${project.pages.length} defined (${effectivePages} effective including template instances)`,
    `Workflows in scope: ${project.workflows.length}`,
    hasErpIntegration(project)
      ? `ERP integrations in scope: ${erpNames.join(', ')} — website↔ERP sync paths confirmed before testing begins`
      : '',
    `Browser and device coverage: ${project.browserTier} tier — ${BROWSER_TIER_DEFINITIONS[project.browserTier]}`,
    `Testing rigor: ${project.rigorLevel} — ${RIGOR_DEFINITIONS[project.rigorLevel]}`,
    `Estimate generated with model: ${output.engineerName} v${output.modelVersion}`,
    `Content and designs are final at the time testing begins`,
    `The development team is available to answer questions during the testing period`,
    project.customBrowserDescription
      ? `Custom browser requirements: ${project.customBrowserDescription}`
      : '',
  ].filter(Boolean)
}

const CHANGE_TRIGGERS: string[] = [
  'Scope increases beyond the agreed page count or workflow count',
  'Additional test types requested after this estimate is approved',
  'Significant change to the complexity of pages or workflows already in scope',
  'New browser, device, or accessibility requirements beyond the agreed tier',
  'Discovery during testing of previously undisclosed integrations or features',
  'Content or design changes after testing has begun',
]

function buildOptionalAddOns(project: ProjectSpec, output: ScheduleOutput): string[] {
  const active = new Set(output.activeTestTypes)
  const addOns: string[] = []

  if (!active.has(TestType.E2EAutomation) && !project.includeAutomation) {
    addOns.push(`${TestType.E2EAutomation} — automated regression suite for CI/CD integration`)
  }
  if (!active.has(TestType.Exploratory)) {
    addOns.push(`${TestType.Exploratory} — time-boxed expert testing of high-risk areas`)
  }
  if (!active.has(TestType.CMSAdmin)) {
    addOns.push(`${TestType.CMSAdmin} — backend dashboard and content management workflows`)
  }
  if (project.browserTier === BrowserTier.Standard) {
    addOns.push(`Enhanced browser coverage — adds Firefox + real-device spot checks`)
  }
  if (project.rigorLevel === RigorLevel.Standard) {
    addOns.push(`Upgraded to Enhanced rigor — deeper exploration, more edge cases`)
  }

  addOns.push('Accessibility audit to WCAG 2.1 AA with remediation recommendations')
  addOns.push('Performance audit with optimisation recommendations')

  return addOns
}

// ---------------------------------------------------------------------------
// Main factory
// ---------------------------------------------------------------------------

export function generateClientScopeDoc(
  project:           ProjectSpec,
  output:            ScheduleOutput,
  retestingIncluded: boolean,
): ClientScopeDoc {
  return {
    projectName: project.projectName,
    clientName:  project.clientName,
    preparedBy:  PREPARED_BY,
    preparedAt:  new Date().toISOString(),
    sections: {
      whatWeWillTest: {
        heading:  'What we will test',
        items:    buildWillTest(project, output),
        editable: true,
      },
      whatWeWillNotTest: {
        heading:  'What we will NOT test',
        items:    buildWillNotTest(project, output),
        editable: true,
      },
      whatWeNeedFromYou: {
        heading:  'What we need from you',
        items:    buildNeededFromYou(project),
        editable: true,
      },
      deliverables: {
        heading:  'Deliverables',
        items:    buildDeliverables(output, retestingIncluded),
        editable: true,
      },
      assumptions: {
        heading:  'Assumptions',
        items:    buildAssumptions(project, output),
        editable: true,
      },
      changeTriggers: {
        heading:  'What would trigger a re-estimate',
        items:    [...CHANGE_TRIGGERS],
        editable: true,
      },
      optionalAddOns: {
        heading:  'Optional add-ons (not included in this estimate)',
        items:    buildOptionalAddOns(project, output),
        editable: true,
      },
    },
  }
}

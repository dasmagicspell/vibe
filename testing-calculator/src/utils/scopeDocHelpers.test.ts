import { describe, it, expect } from 'vitest'
import { generateClientScopeDoc } from './scopeDocHelpers'
import {
  createDefaultProject, createPageSpec, createIntegrationSpec,
  ERP_INTEGRATION_CATEGORY,
} from './projectHelpers'
import { createDefaultModel } from './modelHelpers'
import { runCalculationEngine } from '@/services/CalculationEngine'
import {
  AccountScope, PaymentScope, ProjectMoment,
  ComplexityLevel, TestType,
} from '@/types'

function makeOutput(projectOverrides = {}) {
  const model   = { ...createDefaultModel(), engineerName: 'Jane' }
  const project = {
    ...createDefaultProject(),
    projectName: 'Test',
    clientName:  'Client',
    pages: [createPageSpec({ name: 'Home', complexity: ComplexityLevel.Medium })],
    ...projectOverrides,
  }
  const output = runCalculationEngine(model, project)
  return { model, project, output }
}

describe('generateClientScopeDoc', () => {
  it('sets project and client name', () => {
    const { project, output } = makeOutput()
    const doc = generateClientScopeDoc(project, output, true)
    expect(doc.projectName).toBe('Test')
    expect(doc.clientName).toBe('Client')
    expect(doc.preparedBy).toBe('A Positive Future')
  })

  it('whatWeWillTest includes all active test types', () => {
    const { project, output } = makeOutput()
    const doc = generateClientScopeDoc(project, output, true)
    output.activeTestTypes.forEach(tt => {
      const found = doc.sections.whatWeWillTest.items.some(item => item.startsWith(tt))
      expect(found, `Expected ${tt} in "will test"`).toBe(true)
    })
  })

  it('whatWeWillTest mentions integrations in matrix coverage when present', () => {
    const { project, output } = makeOutput({
      integrations: [createIntegrationSpec({ name: 'Odoo', category: ERP_INTEGRATION_CATEGORY })],
    })
    const doc = generateClientScopeDoc(project, output, true)
    const matrixLine = doc.sections.whatWeWillTest.items.find(item =>
      item.includes('Estimation matrix coverage'),
    )
    expect(matrixLine).toBeDefined()
    expect(matrixLine).toContain('Odoo')
    expect(matrixLine).toContain('integration')
  })

  it('whatWeWillNotTest includes penetration testing exclusion', () => {
    const { project, output } = makeOutput()
    const doc = generateClientScopeDoc(project, output, true)
    const items = doc.sections.whatWeWillNotTest.items.join(' ')
    expect(items).toContain('Penetration testing')
  })

  it('whatWeNeedFromYou includes credentials when auth is required', () => {
    const { project, output } = makeOutput({ accountScope: AccountScope.MultipleRoles })
    const doc = generateClientScopeDoc(project, output, true)
    const items = doc.sections.whatWeNeedFromYou.items.join(' ')
    expect(items).toContain('credentials')
  })

  it('whatWeNeedFromYou includes test cards when payments are involved', () => {
    const { project, output } = makeOutput({ paymentScope: PaymentScope.SimpleCheckout })
    const doc = generateClientScopeDoc(project, output, true)
    const items = doc.sections.whatWeNeedFromYou.items.join(' ')
    expect(items.toLowerCase()).toContain('credit card')
  })

  it('whatWeNeedFromYou includes URL mapping for migration projects', () => {
    const { project, output } = makeOutput({ projectMoment: ProjectMoment.Migration })
    const doc = generateClientScopeDoc(project, output, true)
    const items = doc.sections.whatWeNeedFromYou.items.join(' ')
    expect(items).toContain('URL mapping')
  })

  it('whatWeNeedFromYou includes analytics plan when analytics integration exists', () => {
    const integration = createIntegrationSpec({ hasAnalytics: true, name: 'GA4' })
    const { project, output } = makeOutput({ integrations: [integration] })
    const doc = generateClientScopeDoc(project, output, true)
    const items = doc.sections.whatWeNeedFromYou.items.join(' ').toLowerCase()
    expect(items).toContain('analytics')
  })

  it('whatWeNeedFromYou includes ERP prerequisites when an ERP integration exists', () => {
    const integration = createIntegrationSpec({
      name: 'Odoo eCommerce',
      category: ERP_INTEGRATION_CATEGORY,
    })
    const { project, output } = makeOutput({ integrations: [integration] })
    const doc = generateClientScopeDoc(project, output, true)
    const items = doc.sections.whatWeNeedFromYou.items.join(' ').toLowerCase()
    expect(items).toContain('odoo')
    expect(items).toContain('synced')
    expect(items).toContain('webhook')
  })

  it('assumptions names ERP integrations in scope', () => {
    const integration = createIntegrationSpec({
      name: 'Odoo',
      category: ERP_INTEGRATION_CATEGORY,
    })
    const { project, output } = makeOutput({ integrations: [integration] })
    const doc = generateClientScopeDoc(project, output, true)
    const items = doc.sections.assumptions.items.join(' ')
    expect(items).toContain('ERP integrations in scope')
    expect(items).toContain('Odoo')
  })

  it('whatWeWillNotTest excludes ERP platform work when ERP is in scope', () => {
    const integration = createIntegrationSpec({ category: ERP_INTEGRATION_CATEGORY })
    const { project, output } = makeOutput({ integrations: [integration] })
    const doc = generateClientScopeDoc(project, output, true)
    const items = doc.sections.whatWeWillNotTest.items.join(' ')
    expect(items).toContain('Odoo/ERP platform administration')
  })

  it('deliverables includes bug report when retesting included', () => {
    const { project, output } = makeOutput()
    const doc = generateClientScopeDoc(project, output, true)
    const items = doc.sections.deliverables.items.join(' ')
    expect(items).toContain('Retesting pass')
  })

  it('deliverables does not include retesting when excluded', () => {
    const { project, output } = makeOutput()
    const doc = generateClientScopeDoc(project, output, false)
    const items = doc.sections.deliverables.items.join(' ')
    expect(items).not.toContain('Retesting pass')
  })

  it('assumptions includes page count', () => {
    const { project, output } = makeOutput()
    const doc = generateClientScopeDoc(project, output, true)
    const items = doc.sections.assumptions.items.join(' ')
    expect(items).toContain('1 defined')
  })

  it('changeTriggers is not empty', () => {
    const { project, output } = makeOutput()
    const doc = generateClientScopeDoc(project, output, true)
    expect(doc.sections.changeTriggers.items.length).toBeGreaterThan(0)
  })

  it('optionalAddOns suggests E2E automation when not included', () => {
    const { project, output } = makeOutput({ includeAutomation: false })
    const doc = generateClientScopeDoc(project, output, false)
    const items = doc.sections.optionalAddOns.items.join(' ')
    expect(items).toContain(TestType.E2EAutomation)
  })

  it('all sections have editable = true', () => {
    const { project, output } = makeOutput()
    const doc = generateClientScopeDoc(project, output, true)
    Object.values(doc.sections).forEach(section => {
      expect(section.editable).toBe(true)
    })
  })
})

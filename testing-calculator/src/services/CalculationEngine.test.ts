import { describe, it, expect } from 'vitest'
import {
  addEstimates, scaleEstimate, sumEstimates,
  computeCellEstimate, runCalculationEngine,
} from './CalculationEngine'
import {
  TestType, ComplexityLevel, RigorLevel, BrowserTier, DefectDensity,
} from '@/types'
import { createDefaultModel, createDefaultEntries } from '@/utils/modelHelpers'
import { createDefaultProject, createPageSpec } from '@/utils/projectHelpers'
import { PageCategory } from '@/types'

// ---------------------------------------------------------------------------
// Arithmetic helpers
// ---------------------------------------------------------------------------

describe('addEstimates', () => {
  it('adds two estimates correctly', () => {
    const a = { minHours: 1, expectedHours: 2, maxHours: 3 }
    const b = { minHours: 0.5, expectedHours: 1, maxHours: 1.5 }
    const result = addEstimates(a, b)
    expect(result.minHours).toBe(1.5)
    expect(result.expectedHours).toBe(3)
    expect(result.maxHours).toBe(4.5)
  })

  it('returns zero estimate when adding two zeros', () => {
    const z = { minHours: 0, expectedHours: 0, maxHours: 0 }
    expect(addEstimates(z, z)).toEqual(z)
  })
})

describe('scaleEstimate', () => {
  it('scales by a factor', () => {
    const e = { minHours: 1, expectedHours: 2, maxHours: 4 }
    const result = scaleEstimate(e, 2)
    expect(result.expectedHours).toBe(4)
    expect(result.minHours).toBe(2)
  })

  it('rounds to nearest quarter hour', () => {
    const e = { minHours: 1, expectedHours: 1, maxHours: 1 }
    const result = scaleEstimate(e, 1.1)   // 1.1 → rounds to 1.0 (nearest 0.25)
    expect(result.expectedHours).toBe(1.0)
  })

  it('scales by zero produces zero', () => {
    const e = { minHours: 2, expectedHours: 4, maxHours: 8 }
    expect(scaleEstimate(e, 0)).toEqual({ minHours: 0, expectedHours: 0, maxHours: 0 })
  })
})

describe('sumEstimates', () => {
  it('sums an array of estimates', () => {
    const estimates = [
      { minHours: 1, expectedHours: 2, maxHours: 3 },
      { minHours: 2, expectedHours: 3, maxHours: 4 },
    ]
    const result = sumEstimates(estimates)
    expect(result.expectedHours).toBe(5)
  })

  it('returns zero for empty array', () => {
    expect(sumEstimates([])).toEqual({ minHours: 0, expectedHours: 0, maxHours: 0 })
  })
})

// ---------------------------------------------------------------------------
// computeCellEstimate
// ---------------------------------------------------------------------------

describe('computeCellEstimate — exact match', () => {
  const entries = createDefaultEntries()

  it('returns High certainty when an exact entry exists', () => {
    const result = computeCellEstimate(
      entries,
      TestType.Functional,
      ComplexityLevel.Medium,
      RigorLevel.Standard,
      BrowserTier.Standard,
    )
    expect(result.lookupCertainty).toBe('High')
    expect(result.calibrationCertainty).toBe('High')
    expect(result.needsReview).toBe(false)
    expect(result.estimate.expectedHours).toBeGreaterThan(0)
  })

  it('applies rigor multiplier — Enhanced is higher than Standard', () => {
    const standard = computeCellEstimate(entries, TestType.Functional, ComplexityLevel.Medium, RigorLevel.Standard, BrowserTier.Standard)
    const enhanced = computeCellEstimate(entries, TestType.Functional, ComplexityLevel.Medium, RigorLevel.Enhanced, BrowserTier.Standard)
    expect(enhanced.estimate.expectedHours).toBeGreaterThan(standard.estimate.expectedHours)
  })

  it('applies browser tier scaling for CrossBrowser — Enhanced is more than Basic', () => {
    const basic    = computeCellEstimate(entries, TestType.CrossBrowser, ComplexityLevel.Medium, RigorLevel.Standard, BrowserTier.Basic)
    const enhanced = computeCellEstimate(entries, TestType.CrossBrowser, ComplexityLevel.Medium, RigorLevel.Standard, BrowserTier.Enhanced)
    expect(enhanced.estimate.expectedHours).toBeGreaterThan(basic.estimate.expectedHours)
  })

  it('does NOT apply browser scaling for Functional testing', () => {
    const basic    = computeCellEstimate(entries, TestType.Functional, ComplexityLevel.Medium, RigorLevel.Standard, BrowserTier.Basic)
    const enhanced = computeCellEstimate(entries, TestType.Functional, ComplexityLevel.Medium, RigorLevel.Standard, BrowserTier.Enhanced)
    // Functional test time is the same regardless of browser tier
    expect(basic.estimate.expectedHours).toBe(enhanced.estimate.expectedHours)
  })
})

describe('computeCellEstimate — adjacent fallback', () => {
  it('returns Medium certainty when only adjacent complexity is available', () => {
    // Remove the Low complexity entry for Functional
    const entries = createDefaultEntries().filter(
      e => !(e.testType === TestType.Functional && e.complexity === ComplexityLevel.Low)
    )
    const result = computeCellEstimate(
      entries, TestType.Functional, ComplexityLevel.Low, RigorLevel.Standard, BrowserTier.Standard
    )
    expect(result.lookupCertainty).toBe('Medium')
  })
})

describe('computeCellEstimate — no data fallback', () => {
  it('returns Low certainty and needsReview=true when no entry exists', () => {
    const result = computeCellEstimate(
      [],   // empty entries
      TestType.Functional,
      ComplexityLevel.Medium,
      RigorLevel.Standard,
      BrowserTier.Standard,
    )
    expect(result.lookupCertainty).toBe('Low')
    expect(result.calibrationCertainty).toBe('Low')
    expect(result.needsReview).toBe(true)
    expect(result.estimate.expectedHours).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// runCalculationEngine (integration-level)
// ---------------------------------------------------------------------------

function makeReadyProject() {
  return {
    ...createDefaultProject(),
    projectName: 'Test Project',
    clientName:  'Acme Corp',
    pages: [
      createPageSpec({ name: 'Home',    category: PageCategory.Informational,  complexity: ComplexityLevel.Low }),
      createPageSpec({ name: 'Contact', category: PageCategory.SimpleForm,     complexity: ComplexityLevel.Medium }),
      createPageSpec({ name: 'Shop',    category: PageCategory.ProductListing, complexity: ComplexityLevel.High }),
    ],
  }
}

describe('runCalculationEngine', () => {
  const model   = { ...createDefaultModel(), engineerName: 'Jane Tester' }
  const project = makeReadyProject()
  const output  = runCalculationEngine(model, project)

  it('produces one row per page plus one per workflow', () => {
    expect(output.rows).toHaveLength(project.pages.length + project.workflows.length)
  })

  it('produces a row for each page', () => {
    const labels = output.rows.map(r => r.label)
    expect(labels).toContain('Home')
    expect(labels).toContain('Contact')
  })

  it('execution subtotal is the sum of all row subtotals', () => {
    const manualSum = output.rows.reduce(
      (acc, row) => acc + row.subtotal.expectedHours, 0
    )
    expect(output.executionSubtotal.expectedHours).toBeCloseTo(manualSum, 1)
  })

  it('grand total is greater than execution subtotal (overhead added)', () => {
    expect(output.grandTotal.expectedHours).toBeGreaterThan(
      output.executionSubtotal.expectedHours
    )
  })

  it('grand total min ≤ expected ≤ max', () => {
    expect(output.grandTotal.minHours).toBeLessThanOrEqual(output.grandTotal.expectedHours)
    expect(output.grandTotal.expectedHours).toBeLessThanOrEqual(output.grandTotal.maxHours)
  })

  it('each row has cells for every active test type', () => {
    const activeTypes = output.activeTestTypes
    for (const row of output.rows) {
      for (const tt of activeTypes) {
        expect(row.cells[tt]).toBeDefined()
      }
    }
  })

  it('retesting is zero when retestingIncluded is false', () => {
    const proj = { ...project, retestingIncluded: false }
    const out  = runCalculationEngine(model, proj)
    expect(out.retestingEstimate.expectedHours).toBe(0)
    expect(out.regressionEstimate.expectedHours).toBe(0)
  })

  it('high rigor produces higher estimates than smoke', () => {
    const smoke = runCalculationEngine(model, { ...project, rigorLevel: RigorLevel.Smoke })
    const audit = runCalculationEngine(model, { ...project, rigorLevel: RigorLevel.Audit })
    expect(audit.executionSubtotal.expectedHours)
      .toBeGreaterThan(smoke.executionSubtotal.expectedHours)
  })

  it('template page with multiple instances multiplies estimates', () => {
    const proj = {
      ...createDefaultProject(),
      projectName: 'Tpl Test',
      clientName:  'Client',
      pages: [
        createPageSpec({ name: 'Blog Post', isTemplate: true, templateInstanceCount: 10, complexity: ComplexityLevel.Low }),
      ],
    }
    const single = runCalculationEngine(model, {
      ...proj,
      pages: [createPageSpec({ name: 'Blog Post', isTemplate: false, complexity: ComplexityLevel.Low })],
    })
    const multi = runCalculationEngine(model, proj)
    // Multi-instance should be approximately 10× the single estimate
    expect(multi.executionSubtotal.expectedHours)
      .toBeCloseTo(single.executionSubtotal.expectedHours * 10, 0)
  })

  it('high defect density produces higher retesting estimate than low', () => {
    const low  = runCalculationEngine(model, { ...project, defectDensityOverride: DefectDensity.Low  })
    const high = runCalculationEngine(model, { ...project, defectDensityOverride: DefectDensity.High })
    expect(high.retestingEstimate.expectedHours)
      .toBeGreaterThan(low.retestingEstimate.expectedHours)
  })

  it('E2E automation appears in deliverableLineItems when opted in', () => {
    const proj = { ...project, includeAutomation: true }
    const out  = runCalculationEngine(model, proj)
    const hasE2E = out.deliverableLineItems.some(d => d.label === TestType.E2EAutomation)
    expect(hasE2E).toBe(true)
  })

  it('returns empty review flags when all entries are calibrated', () => {
    expect(output.reviewFlags).toHaveLength(0)
  })

  it('each cell includes certainty breakdown', () => {
    const cell = output.rows[0].cells[TestType.Functional]
    expect(cell.certaintyBreakdown).toBeDefined()
    expect(cell.certaintyBreakdown.lookup).toBeDefined()
    expect(cell.certaintyBreakdown.calibration).toBeDefined()
    expect(cell.certaintyBreakdown.intake).toBeDefined()
  })

  it('cell testCases come from model representativeTestCases', () => {
    const custom = [{ id: 'custom-func', description: 'Verify bespoke widget' }]
    const modelWithCases = {
      ...model,
      representativeTestCases: {
        ...model.representativeTestCases,
        [TestType.Functional]: custom,
      },
    }
    const out = runCalculationEngine(modelWithCases, project)
    const cell = out.rows[0].cells[TestType.Functional]
    expect(cell.testCases).toEqual(custom)
  })

  it('cell testCases are empty when model has none for that type', () => {
    const modelEmpty = {
      ...model,
      representativeTestCases: {
        ...model.representativeTestCases,
        [TestType.Functional]: [],
      },
    }
    const out = runCalculationEngine(modelEmpty, project)
    const cell = out.rows[0].cells[TestType.Functional]
    expect(cell.testCases).toHaveLength(0)
  })

  it('caps cell certainty when engineer sets Medium calibration', () => {
    const entries = createDefaultEntries().map(e =>
      e.testType === TestType.Functional && e.complexity === ComplexityLevel.Low
        ? { ...e, certainty: 'Medium' as const }
        : e
    )
    const modelWithMedium = { ...model, entries }
    const out = runCalculationEngine(modelWithMedium, project)
    const homeCell = out.rows.find(r => r.label === 'Home')?.cells[TestType.Functional]
    expect(homeCell?.certainty).toBe('Medium')
  })

  it('caps cell certainty when intake complexity confidence is Low', () => {
    const proj = {
      ...project,
      pages: [
        createPageSpec({
          name: 'Home',
          category: PageCategory.Informational,
          complexity: ComplexityLevel.Low,
          complexityCertainty: 'Low' as const,
        }),
      ],
    }
    const out = runCalculationEngine(model, proj)
    const cell = out.rows[0].cells[TestType.Functional]
    expect(cell.certainty).toBe('Low')
  })

  it('default certainty multipliers do not change execution subtotal', () => {
    const baseline = output.executionSubtotal.expectedHours
    const withExplicitDefaults = runCalculationEngine(
      {
        ...model,
        teCertaintyMultipliers: { High: 1, Medium: 1, Low: 1 },
      },
      {
        ...project,
        amConfidenceMultipliers: { High: 1, Medium: 1, Low: 1 },
      },
    )
    expect(withExplicitDefaults.executionSubtotal.expectedHours).toBeCloseTo(baseline, 2)
  })

  it('TE Low multiplier increases hours when calibration certainty is Low', () => {
    const entries = createDefaultEntries().map(e =>
      e.testType === TestType.Functional && e.complexity === ComplexityLevel.Low
        ? { ...e, certainty: 'Low' as const }
        : e
    )
    const baselineModel = {
      ...model,
      entries,
      teCertaintyMultipliers: { High: 1, Medium: 1, Low: 1 },
    }
    const baseline = runCalculationEngine(baselineModel, project)
    const boosted = runCalculationEngine(
      {
        ...baselineModel,
        teCertaintyMultipliers: { High: 1, Medium: 1, Low: 1.5 },
      },
      project,
    )
    const homeBaseline = baseline.rows.find(r => r.label === 'Home')?.cells[TestType.Functional]
    const homeBoosted = boosted.rows.find(r => r.label === 'Home')?.cells[TestType.Functional]
    expect(homeBoosted!.estimate.expectedHours).toBeCloseTo(
      homeBaseline!.estimate.expectedHours * 1.5,
      1,
    )
  })

  it('AM Low multiplier increases hours when intake confidence is Low', () => {
    const proj = {
      ...project,
      pages: [
        createPageSpec({
          name: 'Home',
          category: PageCategory.Informational,
          complexity: ComplexityLevel.Low,
          complexityCertainty: 'Low' as const,
        }),
      ],
      amConfidenceMultipliers: { High: 1, Medium: 1, Low: 1 },
    }
    const baseline = runCalculationEngine(model, proj)
    const boosted = runCalculationEngine(model, {
      ...proj,
      amConfidenceMultipliers: { High: 1, Medium: 1, Low: 1.5 },
    })
    const cellBaseline = baseline.rows[0].cells[TestType.Functional]
    const cellBoosted = boosted.rows[0].cells[TestType.Functional]
    expect(cellBoosted.estimate.expectedHours).toBeCloseTo(
      cellBaseline.estimate.expectedHours * 1.5,
      1,
    )
  })

  it('TE and AM Low multipliers stack multiplicatively', () => {
    const entries = createDefaultEntries().map(e =>
      e.testType === TestType.Functional && e.complexity === ComplexityLevel.Low
        ? { ...e, certainty: 'Low' as const }
        : e
    )
    const proj = {
      ...project,
      pages: [
        createPageSpec({
          name: 'Home',
          category: PageCategory.Informational,
          complexity: ComplexityLevel.Low,
          complexityCertainty: 'Low' as const,
        }),
      ],
      amConfidenceMultipliers: { High: 1, Medium: 1, Low: 1 },
    }
    const baseline = runCalculationEngine(
      {
        ...model,
        entries,
        teCertaintyMultipliers: { High: 1, Medium: 1, Low: 1 },
      },
      proj,
    )
    const boosted = runCalculationEngine(
      {
        ...model,
        entries,
        teCertaintyMultipliers: { High: 1, Medium: 1, Low: 1.5 },
      },
      {
        ...proj,
        amConfidenceMultipliers: { High: 1, Medium: 1, Low: 1.5 },
      },
    )
    const cellBaseline = baseline.rows[0].cells[TestType.Functional]
    const cellBoosted = boosted.rows[0].cells[TestType.Functional]
    const expectedStacked = scaleEstimate(cellBaseline.estimate, 1.5 * 1.5)
    expect(cellBoosted.estimate.expectedHours).toBe(expectedStacked.expectedHours)
  })

  it('certainty multipliers scale execution subtotal and grand total', () => {
    const proj = {
      ...project,
      amConfidenceMultipliers: { High: 1.1, Medium: 1, Low: 1 },
    }
    const boosted = runCalculationEngine(model, proj)
    expect(boosted.executionSubtotal.expectedHours).toBeGreaterThan(
      output.executionSubtotal.expectedHours,
    )
    expect(boosted.grandTotal.expectedHours).toBeGreaterThan(output.grandTotal.expectedHours)
  })
})

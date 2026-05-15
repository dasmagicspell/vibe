# QA Estimation Calculator — Master Specification
**Project**: A Positive Future — Internal tool  
**Version**: 1.0 (Sprint 1 complete)  
**Last updated**: Sprint 1

---

## Purpose

A web-based, single-file app that lets a test engineer calibrate a time-estimation model, 
and lets an account manager run a client intake to generate a data-driven QA schedule.

---

## Technology Stack

| Concern | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | React 18 |
| Build tool | Vite with `vite-plugin-singlefile` → one `index.html` |
| Styling | Tailwind CSS |
| State | React Context + useReducer (AppContext) |
| Persistence | localStorage (session) + JSON file import/export |
| Output | Browser print dialog with `@media print` stylesheet |
| Tests | Vitest + React Testing Library |
| Deployment | Static single HTML file, distributed via shared Teams folder |

---

## File Structure

```
testing-calculator/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── SPEC.md                          ← this file
└── src/
    ├── main.tsx
    ├── App.tsx                      ← router, AppProvider wrapper
    ├── index.css
    ├── test-setup.ts
    ├── types/
    │   └── index.ts                 ← ALL enums and interfaces (single source of truth)
    ├── services/
    │   ├── StorageService.ts        ← localStorage + JSON file import/export
    │   ├── StorageService.test.ts
    │   └── CalculationEngine.ts     ← Sprint 4
    ├── context/
    │   └── AppContext.tsx           ← AppState, AppAction, AppProvider, hooks
    ├── hooks/                       ← custom hooks (Sprint 3+)
    ├── components/
    │   ├── shared/
    │   │   ├── NavBar.tsx
    │   │   └── Tooltip.tsx          ← reusable definition tooltip
    │   ├── calibration/             ← Sprint 2
    │   ├── intake/                  ← Sprint 3
    │   └── schedule/                ← Sprint 4
    ├── views/
    │   ├── HomeView.tsx             ← role selector + model import
    │   ├── CalibrateView.tsx        ← Sprint 2
    │   ├── IntakeView.tsx           ← Sprint 3
    │   └── ScheduleView.tsx         ← Sprint 4
    └── utils/                       ← time formatting, interpolation (Sprint 4)
```

---

## Domain Model Summary

All types live in `src/types/index.ts`. **Do not duplicate or redefine them.**

### Key Enums

| Enum | Values | Notes |
|---|---|---|
| `PageCategory` | 12 values | Rows in the schedule matrix |
| `TestType` | 18 values | Columns in the schedule matrix |
| `ComplexityLevel` | Low, Medium, High | Applied to pages and workflows |
| `RigorLevel` | Smoke, Standard, Enhanced, Audit | Applied to entire project |
| `BrowserTier` | Basic, Standard, Enhanced, Custom | Cross-browser scope |
| `SiteType` | 5 values | Brochure, Nonprofit, Ecommerce, Portal, WorkflowApp |
| `ProjectMoment` | 5 values | NewLaunch, Redesign, Maintenance, BugFix, Migration |
| `SensitiveDataLevel` | 4 values | None through HealthLegal |
| `PaymentScope` | 4 values | None through FullEcommerce |
| `AccountScope` | 3 values | None, BasicLogin, MultipleRoles |
| `RiskLevel` | Low, Medium, High | |
| `ReportingLevel` | 3 values | Internal through Formal |
| `DefectDensity` | Low, Medium, High | Churn/retesting calibration param |
| `DeliverableType` | 3 values | TestPlan, UATSupport, FinalQAReport |

### Key Multipliers

```
COMPLEXITY_MULTIPLIERS: Low=1.0, Medium=1.4, High=2.0
RIGOR_MULTIPLIERS:      Smoke=0.5, Standard=1.0, Enhanced=1.5, Audit=2.2
DEFECT_DENSITY_MULTIPLIERS: Low=0.10, Medium=0.20, High=0.35
```

### Calculation Formula

```
CellEstimate = BaseEstimate(pageCategory, testType, complexity=Standard)
             × COMPLEXITY_MULTIPLIERS[complexity]
             × RIGOR_MULTIPLIERS[rigorLevel]

RetestingEstimate  = ExecutionSubtotal × DEFECT_DENSITY_MULTIPLIERS[defectDensity]
RegressionEstimate = RetestingEstimate × 0.6   (regression ≈ 60% of retesting)

CoordinationOverhead = ExecutionSubtotal × overheadFactors.coordinationFraction
ReportingOverhead    = ExecutionSubtotal × overheadFactors.reportingFraction

GrandTotal = ExecutionSubtotal + RetestingEstimate + RegressionEstimate
           + CoordinationOverhead + ReportingOverhead
           + sum(deliverableEstimates)
```

### Conditional Test Types

These test type columns only appear in the schedule matrix when activated by intake answers:

| Test type | Activates when |
|---|---|
| Form validation | `project.pages` includes any form category, OR `formCount > 0` |
| Role / Permission | `accountScope = MultipleRoles` |
| Analytics and tag | any integration has `hasAnalytics = true` |
| CMS / Admin | `includeCMSAdmin = true` |
| Email / Notification | `forms > 0` OR `workflows > 0` |
| Content migration | `projectMoment = Migration` |
| Exploratory | `includeExploratory = true` |
| E2E automation | `includeAutomation = true` |

---

## Application State

```typescript
AppState {
  role:         'engineer' | 'manager' | null
  model:        TestingModel | null    // loaded from JSON file
  project:      ProjectSpec | null     // built in intake form
  schedule:     ScheduleOutput | null  // produced by CalculationEngine
  scopeDoc:     ClientScopeDoc | null  // auto-populated in Sprint 5
  modelDirty:   boolean
  projectDirty: boolean
}
```

State lives in `AppContext`. Dispatch actions to modify it. 
Components **never** mutate state directly.

---

## Persistence Rules

1. `model` and `project` auto-save to `localStorage` on every change (handled in AppProvider useEffect)
2. On app start, both are loaded from `localStorage` if present
3. Export = `StorageService.exportModelToFile(model)` → triggers browser download of `.json`
4. Import = `StorageService.importModelFromFile()` → opens file picker, returns parsed model
5. Type guards in StorageService validate imported JSON before it enters state

---

## Sprint Roadmap

### Sprint 1 ✅ — Foundation (this sprint)
- Project scaffold (Vite + React + TS + Tailwind)
- All types in `src/types/index.ts`
- StorageService with tests
- AppContext with useReducer
- NavBar, Tooltip shared components
- HomeView (role selector + model import)
- Placeholder views for Calibrate, Intake, Schedule
- SPEC.md

### Sprint 2 — Calibration wizard
Build `CalibrateView` as a 7-step wizard:
1. Engineer profile (name, version, notes)
2. Overhead factors (coordinationFraction, reportingFraction, defaultDefectDensity)
3. Scenario matrix — for each (PageCategory × TestType × ComplexityLevel) combination, 
   collect a 3-point TimeEstimate (min, expected, max). Only prompt for commonly-used 
   combinations; allow "skip" for rare ones.
4. Browser tier calibration — one TimeEstimate per BrowserTier (per-page estimate)
5. Deliverable estimates — one TimeEstimate per DeliverableType
6. Exploratory blocks — define 2-4 block options (label + hours)
7. Review and export — show summary, export `testing-model.json`

Key components: `StepWizard`, `TimeEstimateInput` (3 fields: min/expected/max), 
`CalibrationScenarioTable`, `BrowserCalibrationPanel`.

All complexity definitions shown with Tooltip component (definitions already in types/index.ts).

### Sprint 3 — Client intake form
Build `IntakeView` as a sectioned single-page form with a sticky progress sidebar.

Sections (in order):
1. Project identity — name, client, date
2. Site profile — SiteType, ProjectMoment, SensitiveDataLevel
3. Pages — dynamic list of PageSpec (add/remove/edit), each with category, complexity, 
   template flag, instance count. Show complexity tooltip.
4. Workflows — dynamic list of WorkflowSpec (add/remove/edit)
5. Integrations — dynamic list of IntegrationSpec
6. E-commerce scope — PaymentScope, AccountScope
7. Risk and rigor — RiskLevel, RigorLevel (with tooltips), BrowserTier (with tooltips)
8. Test types — show always-active types as checked/locked; show conditional types with 
   their activation condition; show optional types (exploratory, automation) as checkboxes
9. Deliverables and reporting — ReportingLevel, retestingIncluded, DeliverableType checkboxes
10. Review — summary of all selections, [Generate schedule] button

On generate: call CalculationEngine (Sprint 4), dispatch SET_SCHEDULE, navigate to /schedule.

### Sprint 4 — Calculation engine + schedule output
Build `src/services/CalculationEngine.ts`:
- Input: TestingModel + ProjectSpec
- Output: ScheduleOutput
- Logic: formula described above in this spec
- Certainty assignment:
  - High = exact calibration entry found (exact pageCategory + testType + complexity match)
  - Medium = adjacent complexity found and interpolated
  - Low = only category match or cross-type inference; flag for engineer review

Build `ScheduleView`:
- Pivot matrix table: rows = pages + workflows, columns = active test types
- Each cell: time range (e.g. "2.5–4 hrs") + CertaintyBadge
- Click any cell → drill-down modal showing TestCase[] list
- Below matrix: summary panel with retesting, regression, overhead, deliverables, grand total
- Retesting/regression section with educational callout (exact text from spec decisions)
- Review flags panel (cells with Low certainty)
- Print button → `window.print()` (print stylesheet hides nav)

### Sprint 5 — Polish + client scope tab
- Client scope tab in ScheduleView (auto-populated ClientScopeDoc)
- CSV export of matrix
- Model version warning if project was created with a different model version
- Form validation and error states throughout
- Empty state handling (no calibration entries for a combination)
- Accessibility pass (keyboard navigation, ARIA labels)

---

## UI/UX Rules

- **Tooltip**: use `<Tooltip content={COMPLEXITY_DEFINITIONS[level]}>` wherever complexity, 
  rigor, browser tier, or defect density is displayed or selected
- **Certainty badges**: 
  - High = green pill (`bg-green-100 text-green-800`)
  - Medium = yellow pill (`bg-yellow-100 text-yellow-800`)
  - Low = red pill (`bg-red-100 text-red-800`)
- **Time ranges**: always display as "X.X–Y.Y hrs" using `expectedHours` for the midpoint 
  and `minHours`/`maxHours` for the range
- **Print styles**: `no-print` class hides nav and controls; `@media print` in index.html
- **Error states**: red border + error message below field; never block navigation silently
- **No backend**: everything is client-side; state in localStorage; sharing via JSON files

---

## Retesting vs. Regression — UI Text (required, verbatim)

This text must appear as a callout in the schedule summary section:

> **Retesting** confirms that a specific reported issue was fixed.
> **Regression testing** checks whether the fix broke nearby or related functionality.
> These are related but separate activities and may be estimated separately depending on project risk.

---

## Testing Rules

- Unit tests for all pure functions in `src/services/` and `src/utils/`
- Use Vitest + React Testing Library
- Tests live alongside source files as `*.test.ts` or `*.test.tsx`
- Run with `npm test`
- Type-check with `npm run typecheck`

---

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server at localhost:5173
npm run build     # build single index.html to dist/
npm test          # run unit tests
npm run typecheck # TypeScript check without building
```

---

*This document is the authoritative reference for all sprints.  
When handing off to another LLM session, provide this file plus the current `src/types/index.ts`.*

import type { ProjectSpec } from '@/types'
import { SiteType, ProjectMoment, SensitiveDataLevel } from '@/types'
import { RadioGroup } from '@/components/shared/RadioGroup'
import { StepNav } from '@/components/calibration/StepWizard'

interface Props {
  data: Pick<ProjectSpec, 'siteType' | 'projectMoment' | 'sensitiveData'>
  onChange: (updates: Partial<ProjectSpec>) => void
  onBack: () => void
  onNext: () => void
}

const SITE_TYPE_OPTIONS = [
  { value: SiteType.Brochure,    label: 'Brochure',     description: 'Marketing site, minimal interactivity' },
  { value: SiteType.Nonprofit,   label: 'Nonprofit',    description: 'Donations, events, volunteer forms' },
  { value: SiteType.Ecommerce,   label: 'E-commerce',   description: 'Products, cart, checkout' },
  { value: SiteType.Portal,      label: 'Portal',       description: 'Authenticated user dashboard' },
  { value: SiteType.WorkflowApp, label: 'Workflow app', description: 'Custom multi-step processes' },
]

const PROJECT_MOMENT_OPTIONS = [
  { value: ProjectMoment.NewLaunch,   label: 'New launch',   description: 'First release of the site' },
  { value: ProjectMoment.Redesign,    label: 'Redesign',     description: 'Visual or structural overhaul' },
  { value: ProjectMoment.Maintenance, label: 'Maintenance',  description: 'Ongoing updates to live site' },
  { value: ProjectMoment.BugFix,      label: 'Bug fix',      description: 'Targeted fix for known issues' },
  { value: ProjectMoment.Migration,   label: 'Migration',    description: 'Platform or content migration' },
]

const SENSITIVE_DATA_OPTIONS = [
  { value: SensitiveDataLevel.None,        label: 'None',         description: 'No personal data collected' },
  { value: SensitiveDataLevel.ContactInfo, label: 'Contact info', description: 'Name, email, phone' },
  { value: SensitiveDataLevel.Payment,     label: 'Payment data', description: 'Credit cards, billing' },
  { value: SensitiveDataLevel.HealthLegal, label: 'Health / legal', description: 'Medical, financial, legal' },
]

export function Section2SiteProfile({ data, onChange, onBack, onNext }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Site profile</h2>
        <p className="mt-1 text-sm text-gray-500">
          These answers shape which test types are recommended and how complexity is estimated.
        </p>
      </div>

      <RadioGroup
        name="site-type"
        label="What kind of site is this?"
        value={data.siteType}
        onChange={v => onChange({ siteType: v as SiteType })}
        options={SITE_TYPE_OPTIONS}
        columns={3}
      />

      <RadioGroup
        name="project-moment"
        label="What is the project moment?"
        tooltip="A migration project automatically activates Content Migration testing. A new launch or redesign sets context for risk assessment."
        value={data.projectMoment}
        onChange={v => onChange({ projectMoment: v as ProjectMoment })}
        options={PROJECT_MOMENT_OPTIONS}
        columns={3}
      />

      <RadioGroup
        name="sensitive-data"
        label="Does the site collect sensitive information?"
        tooltip="Sites collecting payment or health data require additional security and privacy testing attention."
        value={data.sensitiveData}
        onChange={v => onChange({ sensitiveData: v as SensitiveDataLevel })}
        options={SENSITIVE_DATA_OPTIONS}
        columns={4}
      />

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  )
}

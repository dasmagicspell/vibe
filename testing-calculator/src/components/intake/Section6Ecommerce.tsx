import type { ProjectSpec } from '@/types'
import { PaymentScope, AccountScope } from '@/types'
import { RadioGroup } from '@/components/shared/RadioGroup'
import { StepNav } from '@/components/calibration/StepWizard'

interface Props {
  data: Pick<ProjectSpec, 'paymentScope' | 'accountScope'>
  onChange: (updates: Partial<ProjectSpec>) => void
  onBack: () => void
  onNext: () => void
}

const PAYMENT_OPTIONS = [
  {
    value: PaymentScope.None,
    label: 'No payments',
    description: 'No transactions — purely informational',
  },
  {
    value: PaymentScope.SimpleCheckout,
    label: 'Simple checkout',
    description: 'Fixed-price purchase, single payment method',
  },
  {
    value: PaymentScope.Subscriptions,
    label: 'Subscriptions',
    description: 'Recurring billing, plan management',
  },
  {
    value: PaymentScope.FullEcommerce,
    label: 'Full e-commerce',
    description: 'Shipping, tax, coupons, multiple payment methods',
  },
]

const ACCOUNT_OPTIONS = [
  {
    value: AccountScope.None,
    label: 'No accounts',
    description: 'No login or registration',
  },
  {
    value: AccountScope.BasicLogin,
    label: 'Basic login',
    description: 'Register, login, password reset',
  },
  {
    value: AccountScope.MultipleRoles,
    label: 'Multiple roles',
    description: 'Admin, editor, customer, etc. — activates Role/Permission testing',
  },
]

export function Section6Ecommerce({ data, onChange, onBack, onNext }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">E-commerce and user accounts</h2>
        <p className="mt-1 text-sm text-gray-500">
          These answers determine how much e-commerce and authentication testing is scoped.
          Multiple user roles will automatically activate Role/Permission testing.
        </p>
      </div>

      <RadioGroup
        name="payment-scope"
        label="Are payments involved?"
        tooltip="Complex payment flows (subscriptions, shipping, coupons) require significantly more test cases than simple single-item checkouts."
        value={data.paymentScope}
        onChange={v => onChange({ paymentScope: v as PaymentScope })}
        options={PAYMENT_OPTIONS}
        columns={2}
      />

      <RadioGroup
        name="account-scope"
        label="Are user accounts involved?"
        tooltip="Multiple roles adds permission-matrix testing — verifying that each role sees the correct pages and can perform only the correct actions."
        value={data.accountScope}
        onChange={v => onChange({ accountScope: v as AccountScope })}
        options={ACCOUNT_OPTIONS}
        columns={3}
      />

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  )
}

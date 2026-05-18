import type { ProjectSpec } from '@/types'
import { PaymentScope, AccountScope, NotificationScope } from '@/types'
import { RadioGroup } from '@/components/shared/RadioGroup'
interface Props {
  data: Pick<ProjectSpec, 'paymentScope' | 'accountScope' | 'notificationScope'>
  onChange: (updates: Partial<ProjectSpec>) => void
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

const NOTIFICATION_OPTIONS = [
  {
    value: NotificationScope.None,
    label: 'No notifications',
    description: 'No email, SMS, or in-app alerts are sent',
  },
  {
    value: NotificationScope.Basic,
    label: 'Basic',
    description: 'Transactional email — confirmations, receipts, password reset',
  },
  {
    value: NotificationScope.Extensive,
    label: 'Extensive',
    description: 'Marketing email, SMS, push, in-app feeds, or multi-channel alerts',
  },
]

export function Section6Ecommerce({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          E-commerce, accounts, and notifications
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          These answers scope payment, authentication, and notification testing.
          Multiple user roles will automatically activate Role/Permission testing;
          Basic or Extensive notifications activate Email / Notification testing.
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

      <RadioGroup
        name="notification-scope"
        label="Are notifications generated?"
        tooltip="Covers transactional email, admin alerts, SMS, push, and in-app notification centers. Extensive scope includes marketing and multi-channel messaging."
        value={data.notificationScope}
        onChange={v => onChange({ notificationScope: v as NotificationScope })}
        options={NOTIFICATION_OPTIONS}
        columns={3}
      />

    </div>
  )
}

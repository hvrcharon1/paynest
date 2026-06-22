// ---------- Payment methods ----------

export type PaymentMethodType = 'card' | 'bank_account' | 'wallet'

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  label: string
  /** Last 4 digits for cards/accounts, or handle for wallets */
  identifier: string
  brand?: string // visa, mastercard, amex, upi, paypal, etc.
  expiry?: string // MM/YY, cards only
  isDefault: boolean
  createdAt: string
}

// ---------- External services ----------

export type ServiceCategory =
  | 'loan'
  | 'rent'
  | 'water'
  | 'electricity'
  | 'internet'
  | 'health_insurance'
  | 'dental_insurance'
  | 'car_insurance'
  | 'citation'
  | 'school_fee'
  | 'p2p'
  | 'vehicle_rental'
  | 'other'

export type Frequency = 'monthly' | 'weekly' | 'biweekly' | 'quarterly' | 'annually' | 'one_time'

export interface ExternalService {
  id: string
  category: ServiceCategory
  /** Display name, e.g. "Chase Auto Loan" or "Riverside Apartments" */
  providerName: string
  /** Free-text account / reference number with the provider */
  accountRef: string
  paymentMethodId: string
  amount: number
  frequency: Frequency
  /** Day of month (1-31) the payment is due */
  dueDay: number
  autopayEnabled: boolean
  notifyDaysBefore: number
  status: 'active' | 'paused' | 'overdue'
  lastPaidAt?: string
  nextDueDate: string // ISO date
  createdAt: string
  notes?: string
}

// ---------- Payment history ----------

export type PaymentStatus = 'upcoming' | 'paid' | 'failed' | 'overdue'

export interface PaymentRecord {
  id: string
  serviceId: string
  amount: number
  dueDate: string
  paidDate?: string
  status: PaymentStatus
  method: 'autopay' | 'manual'
}

// ---------- Notifications ----------

export type NotificationKind = 'due_soon' | 'overdue' | 'autopay_success' | 'autopay_failed' | 'ai_insight'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  message: string
  serviceId?: string
  createdAt: string
  read: boolean
}

// ---------- AI insights ----------

export type InsightSeverity = 'info' | 'warning' | 'critical'

export interface AIInsight {
  id: string
  title: string
  detail: string
  severity: InsightSeverity
  category?: ServiceCategory
  generatedAt: string
}

export interface ForecastPoint {
  month: string // "2026-07"
  predicted: number
  actual?: number
}

// ---------- UI / category metadata ----------

export interface CategoryMeta {
  label: string
  icon: string // lucide icon name, resolved in component
  color: string
}

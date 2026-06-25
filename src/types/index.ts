// ---------- Payment methods ----------

export type PaymentMethodType = 'card' | 'bank_account' | 'wallet'

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  label: string
  /** Last 4 digits for cards/accounts, or handle for wallets */
  identifier: string
  brand?: string
  expiry?: string
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
  | 'credit_card'
  | 'other'

export type Frequency = 'monthly' | 'weekly' | 'biweekly' | 'quarterly' | 'annually' | 'one_time'

/** How the user wants to pay their credit card each billing cycle. */
export type CreditCardPaymentType = 'minimum' | 'statement' | 'custom'

// ---------- Integration tiers ----------

export type IntegrationTier = 'none' | 'portal' | 'oauth'

export interface ExternalService {
  id: string
  category: ServiceCategory
  /** Display name, e.g. "Chase Sapphire Reserve" */
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
  // Integration fields (all optional — default tier is 'none')
  integrationTier?: IntegrationTier
  portalUrl?: string
  loginId?: string
  loginPassword?: string   // stored locally — never sent to any server
  oauthConnectionId?: string
  // Credit card specific fields (only populated when category === 'credit_card')
  creditLimit?: number
  statementBalance?: number
  minimumPayment?: number
  apr?: number
  cardPaymentType?: CreditCardPaymentType
}

// ---------- OAuth ----------

export interface OAuthProvider {
  id: string
  name: string
  description: string
  authUrl: string
  tokenUrl: string
  scope: string
  logoColor: string
  logoInitials: string
  /** When true, a backend server holding a client_secret is required. */
  requiresBackend: boolean
  isCustom?: boolean
  categories: ServiceCategory[]
}

export interface OAuthConnection {
  id: string
  providerId: string
  providerName: string
  clientId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: string       // ISO datetime
  scope: string
  status: 'active' | 'expired' | 'revoked'
  connectedAt: string
  /** Sentinel — this connection is device-bound and never sent to paynest servers. */
  isLocalOnly: true
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

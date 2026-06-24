import type { OAuthProvider } from '@/types'

/**
 * Pre-configured OAuth 2.0 + PKCE provider registry.
 *
 * Users supply their own client_id — paynest never stores or transmits it.
 * Providers marked requiresBackend: true are shown as greyed-out in the UI
 * until a server-side proxy is configured.
 */
export const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Connect PayPal to track P2P payments, subscriptions, and recurring bills.',
    authUrl: 'https://www.paypal.com/signin/authorize',
    tokenUrl: 'https://api-m.paypal.com/v1/oauth2/token',
    scope: 'openid profile email',
    logoColor: '#003087',
    logoInitials: 'PP',
    requiresBackend: false,
    categories: ['p2p'],
  },
  {
    id: 'green_button',
    name: 'Green Button / Utilities',
    description: 'ESPI open data standard — supported by electricity, gas, and water providers.',
    authUrl: 'https://services.greenbuttonconnect.org/DataCustodian/oauth/authorize',
    tokenUrl: 'https://services.greenbuttonconnect.org/DataCustodian/oauth/token',
    scope: 'FB=4_5_15;IntervalDuration=3600;BlockDuration=monthly;HistoryLength=13',
    logoColor: '#16a34a',
    logoInitials: 'GB',
    requiresBackend: false,
    categories: ['electricity', 'water'],
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Bank accounts and loans. Requires a backend server to hold the client_secret.',
    authUrl: '',
    tokenUrl: '',
    scope: 'transactions accounts',
    logoColor: '#111827',
    logoInitials: 'PL',
    requiresBackend: true,
    categories: ['loan'],
  },
  {
    id: 'custom',
    name: 'Custom / Generic OAuth',
    description: 'Any OAuth 2.0 + PKCE provider — enter your own endpoints and scope.',
    authUrl: '',
    tokenUrl: '',
    scope: '',
    logoColor: '#7C3AED',
    logoInitials: '⚙',
    requiresBackend: false,
    isCustom: true,
    categories: [
      'loan', 'rent', 'water', 'electricity', 'internet',
      'health_insurance', 'dental_insurance', 'car_insurance',
      'citation', 'school_fee', 'p2p', 'vehicle_rental', 'other',
    ],
  },
]

export function getProvider(id: string): OAuthProvider | undefined {
  return OAUTH_PROVIDERS.find((p) => p.id === id)
}

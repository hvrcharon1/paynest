const API_BASE = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
  private getUserId(): string | null {
    try {
      const raw = localStorage.getItem('paynest-auth')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.state?.user?.id ?? null
    } catch {
      return null
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const userId = this.getUserId()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }
    if (userId) {
      headers['x-user-id'] = userId
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(body.error || `API error: ${res.status}`)
    }

    return res.json()
  }

  // Auth
  async signUp(name: string, email: string, password: string) {
    return this.request<AuthUserResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  }

  async signIn(email: string, password: string) {
    return this.request<AuthUserResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getMe() {
    return this.request<AuthUserResponse>('/auth/me')
  }

  // Dashboard
  async getDashboard() {
    return this.request<DashboardResponse>('/dashboard')
  }

  // Payment Methods
  async getPaymentMethods() {
    return this.request<PaymentMethodResponse[]>('/payment-methods')
  }

  async createPaymentMethod(data: CreatePaymentMethodInput) {
    return this.request<PaymentMethodResponse>('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async setDefaultPaymentMethod(id: string) {
    return this.request<{ success: boolean }>(`/payment-methods/${id}/default`, {
      method: 'PUT',
    })
  }

  async deletePaymentMethod(id: string) {
    return this.request<{ success: boolean }>(`/payment-methods/${id}`, {
      method: 'DELETE',
    })
  }

  // Services
  async getServices() {
    return this.request<ServiceResponse[]>('/services')
  }

  async getService(id: string) {
    return this.request<ServiceResponse>(`/services/${id}`)
  }

  async createService(data: CreateServiceInput) {
    return this.request<ServiceResponse>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateService(id: string, data: Partial<CreateServiceInput>) {
    return this.request<ServiceResponse>(`/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteService(id: string) {
    return this.request<{ success: boolean }>(`/services/${id}`, {
      method: 'DELETE',
    })
  }

  async markServicePaid(id: string) {
    return this.request<ServiceResponse>(`/services/${id}/pay`, {
      method: 'POST',
    })
  }

  async toggleAutopay(id: string) {
    return this.request<ServiceResponse>(`/services/${id}/toggle-autopay`, {
      method: 'POST',
    })
  }

  // Notifications
  async getNotifications() {
    return this.request<NotificationResponse[]>('/notifications')
  }

  async refreshNotifications() {
    return this.request<NotificationResponse[]>('/notifications/refresh', {
      method: 'POST',
    })
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    })
  }

  async clearNotifications() {
    return this.request<{ success: boolean }>('/notifications', {
      method: 'DELETE',
    })
  }

  // Insights
  async getInsights() {
    return this.request<InsightResponse[]>('/insights')
  }

  async generateInsights() {
    return this.request<InsightResponse[]>('/insights/generate', {
      method: 'POST',
    })
  }

  // History
  async getHistory() {
    return this.request<HistoryResponse[]>('/history')
  }

  async getServiceHistory(serviceId: string) {
    return this.request<HistoryResponse[]>(`/history/service/${serviceId}`)
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health')
  }
}

// Response types
export interface AuthUserResponse {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  provider: string
  createdAt: string
}

export interface DashboardResponse {
  healthScore: number
  monthlySpend: number
  totalServices: number
  autopayCount: number
  autopayPercentage: number
  upcomingPayments: {
    id: string
    providerName: string
    amount: number
    nextDueDate: string
    autopayEnabled: boolean
    category: string
  }[]
  topInsights: {
    id: string
    title: string
    severity: string
  }[]
  categoryBreakdown: {
    category: string
    monthlyTotal: number
  }[]
}

export interface PaymentMethodResponse {
  id: string
  type: string
  label: string
  identifier: string
  brand: string | null
  expiry: string | null
  isDefault: boolean
  createdAt: string
}

export interface CreatePaymentMethodInput {
  type: string
  label: string
  identifier: string
  brand?: string
  expiry?: string
  isDefault?: boolean
}

export interface ServiceResponse {
  id: string
  category: string
  providerName: string
  accountRef: string | null
  paymentMethodId: string | null
  amount: number
  frequency: string
  dueDay: number
  autopayEnabled: boolean
  notifyDaysBefore: number
  status: string
  lastPaidAt: string | null
  nextDueDate: string
  createdAt: string
  notes: string | null
  integrationTier: string | null
  portalUrl: string | null
  loginId: string | null
  oauthConnectionId: string | null
  creditLimit: number | null
  statementBalance: number | null
  minimumPayment: number | null
  apr: number | null
  cardPaymentType: string | null
}

export interface CreateServiceInput {
  category: string
  providerName: string
  accountRef?: string
  paymentMethodId?: string
  amount: number
  frequency: string
  dueDay: number
  autopayEnabled?: boolean
  notifyDaysBefore?: number
  notes?: string
  integrationTier?: string
  portalUrl?: string
  loginId?: string
  oauthConnectionId?: string
  creditLimit?: number
  statementBalance?: number
  minimumPayment?: number
  apr?: number
  cardPaymentType?: string
}

export interface NotificationResponse {
  id: string
  kind: string
  title: string
  message: string | null
  serviceId: string | null
  createdAt: string
  read: boolean
}

export interface InsightResponse {
  id: string
  title: string
  detail: string | null
  severity: string
  category: string | null
  generatedAt: string
}

export interface HistoryResponse {
  id: string
  serviceId: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: string
  method: string
}

export const api = new ApiClient()

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppNotification, ExternalService, OAuthConnection, PaymentMethod } from '@/types'
import { seedPaymentMethods, seedServices } from '@/data/mockData'
import { computeNextDueDate, daysUntil, generateId } from '@/lib/utils'
import { api } from '@/lib/api'

interface AppState {
  paymentMethods: PaymentMethod[]
  services: ExternalService[]
  notifications: AppNotification[]
  oauthConnections: OAuthConnection[]
  hasOnboarded: boolean
  apiAvailable: boolean | null

  // sync
  syncFromApi: () => Promise<void>
  checkApiHealth: () => Promise<boolean>

  // payment methods
  addPaymentMethod: (pm: Omit<PaymentMethod, 'id' | 'createdAt'>) => void
  removePaymentMethod: (id: string) => void
  setDefaultPaymentMethod: (id: string) => void

  // services
  addService: (svc: Omit<ExternalService, 'id' | 'createdAt' | 'nextDueDate' | 'status'>) => void
  updateService: (id: string, patch: Partial<ExternalService>) => void
  removeService: (id: string) => void
  toggleAutopay: (id: string) => void
  markPaid: (id: string) => void

  // notifications
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  refreshNotifications: () => void

  // oauth connections
  addOAuthConnection: (conn: OAuthConnection) => void
  updateOAuthConnection: (id: string, patch: Partial<OAuthConnection>) => void
  removeOAuthConnection: (id: string) => void
  revokeOAuthConnection: (id: string) => void

  resetDemoData: () => void
}

function buildNotificationsFromServices(services: ExternalService[]): AppNotification[] {
  const notifications: AppNotification[] = []
  const now = new Date().toISOString()

  for (const s of services) {
    const d = daysUntil(s.nextDueDate)
    if (s.status === 'overdue') {
      notifications.push({
        id: generateId('notif'),
        kind: 'overdue',
        title: `${s.providerName} is overdue`,
        message: `Payment was due ${s.nextDueDate}.`,
        serviceId: s.id,
        createdAt: now,
        read: false,
      })
    } else if (d >= 0 && d <= s.notifyDaysBefore) {
      notifications.push({
        id: generateId('notif'),
        kind: 'due_soon',
        title: `${s.providerName} due in ${d} day${d === 1 ? '' : 's'}`,
        message: s.autopayEnabled
          ? `Autopay will charge automatically on ${s.nextDueDate}.`
          : `No autopay set — pay manually by ${s.nextDueDate}.`,
        serviceId: s.id,
        createdAt: now,
        read: false,
      })
    }
  }
  return notifications
}

function deriveStatus(s: ExternalService): ExternalService['status'] {
  if (s.status === 'paused') return 'paused'
  return daysUntil(s.nextDueDate) < 0 ? 'overdue' : 'active'
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      paymentMethods: seedPaymentMethods,
      services: seedServices.map((s) => ({ ...s, status: deriveStatus(s) })),
      notifications: buildNotificationsFromServices(seedServices),
      oauthConnections: [],
      hasOnboarded: true,
      apiAvailable: null,

      checkApiHealth: async () => {
        try {
          await api.healthCheck()
          set({ apiAvailable: true })
          return true
        } catch {
          set({ apiAvailable: false })
          return false
        }
      },

      syncFromApi: async () => {
        try {
          const healthy = await api.healthCheck().then(() => true).catch(() => false)
          if (!healthy) {
            set({ apiAvailable: false })
            return
          }

          const [services, paymentMethods, notifications] = await Promise.all([
            api.getServices(),
            api.getPaymentMethods(),
            api.getNotifications(),
          ])

          set({
            services: services.map((s) => ({
              id: s.id,
              category: s.category as ExternalService['category'],
              providerName: s.providerName,
              accountRef: s.accountRef ?? '',
              paymentMethodId: s.paymentMethodId ?? '',
              amount: s.amount,
              frequency: s.frequency as ExternalService['frequency'],
              dueDay: s.dueDay,
              autopayEnabled: s.autopayEnabled,
              notifyDaysBefore: s.notifyDaysBefore,
              status: s.status as ExternalService['status'],
              lastPaidAt: s.lastPaidAt ?? undefined,
              nextDueDate: s.nextDueDate ? s.nextDueDate.slice(0, 10) : '',
              createdAt: s.createdAt,
              notes: s.notes ?? undefined,
              integrationTier: (s.integrationTier as ExternalService['integrationTier']) ?? undefined,
              portalUrl: s.portalUrl ?? undefined,
              loginId: s.loginId ?? undefined,
              oauthConnectionId: s.oauthConnectionId ?? undefined,
              creditLimit: s.creditLimit ?? undefined,
              statementBalance: s.statementBalance ?? undefined,
              minimumPayment: s.minimumPayment ?? undefined,
              apr: s.apr ?? undefined,
              cardPaymentType: (s.cardPaymentType as ExternalService['cardPaymentType']) ?? undefined,
            })),
            paymentMethods: paymentMethods.map((pm) => ({
              id: pm.id,
              type: pm.type as PaymentMethod['type'],
              label: pm.label,
              identifier: pm.identifier,
              brand: pm.brand ?? undefined,
              expiry: pm.expiry ?? undefined,
              isDefault: pm.isDefault,
              createdAt: pm.createdAt,
            })),
            notifications: notifications.map((n) => ({
              id: n.id,
              kind: n.kind as AppNotification['kind'],
              title: n.title,
              message: n.message ?? '',
              serviceId: n.serviceId ?? undefined,
              createdAt: n.createdAt,
              read: n.read,
            })),
            apiAvailable: true,
          })
        } catch {
          set({ apiAvailable: false })
        }
      },

      addPaymentMethod: (pm) => {
        const newPm = { ...pm, id: generateId('pm'), createdAt: new Date().toISOString() }
        set((state) => ({
          paymentMethods: [
            ...state.paymentMethods.map((p) => (pm.isDefault ? { ...p, isDefault: false } : p)),
            newPm,
          ],
        }))
        if (get().apiAvailable) {
          api.createPaymentMethod({
            type: pm.type,
            label: pm.label,
            identifier: pm.identifier,
            brand: pm.brand,
            expiry: pm.expiry,
            isDefault: pm.isDefault,
          }).catch(() => {})
        }
      },

      removePaymentMethod: (id) => {
        set((state) => ({
          paymentMethods: state.paymentMethods.filter((p) => p.id !== id),
        }))
        if (get().apiAvailable) {
          api.deletePaymentMethod(id).catch(() => {})
        }
      },

      setDefaultPaymentMethod: (id) => {
        set((state) => ({
          paymentMethods: state.paymentMethods.map((p) => ({ ...p, isDefault: p.id === id })),
        }))
        if (get().apiAvailable) {
          api.setDefaultPaymentMethod(id).catch(() => {})
        }
      },

      addService: (svc) => {
        const nextDueDate = computeNextDueDate(svc.dueDay, svc.frequency)
        const newSvc: ExternalService = {
          ...svc,
          id: generateId('svc'),
          createdAt: new Date().toISOString(),
          nextDueDate,
          status: 'active',
        }
        set((state) => ({ services: [...state.services, newSvc] }))
        if (get().apiAvailable) {
          api.createService({
            category: svc.category,
            providerName: svc.providerName,
            accountRef: svc.accountRef,
            paymentMethodId: svc.paymentMethodId,
            amount: svc.amount,
            frequency: svc.frequency,
            dueDay: svc.dueDay,
            autopayEnabled: svc.autopayEnabled,
            notifyDaysBefore: svc.notifyDaysBefore,
            notes: svc.notes,
          }).catch(() => {})
        }
      },

      updateService: (id, patch) => {
        set((state) => ({
          services: state.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }))
        if (get().apiAvailable) {
          api.updateService(id, patch as Record<string, unknown>).catch(() => {})
        }
      },

      removeService: (id) => {
        set((state) => ({
          services: state.services.filter((s) => s.id !== id),
        }))
        if (get().apiAvailable) {
          api.deleteService(id).catch(() => {})
        }
      },

      toggleAutopay: (id) => {
        set((state) => ({
          services: state.services.map((s) => (s.id === id ? { ...s, autopayEnabled: !s.autopayEnabled } : s)),
        }))
        if (get().apiAvailable) {
          api.toggleAutopay(id).catch(() => {})
        }
      },

      markPaid: (id) => {
        set((state) => ({
          services: state.services.map((s) => {
            if (s.id !== id) return s
            const next = computeNextDueDate(s.dueDay, s.frequency, new Date(Date.now() + 86400000))
            return { ...s, lastPaidAt: new Date().toISOString(), nextDueDate: next, status: 'active' }
          }),
        }))
        if (get().apiAvailable) {
          api.markServicePaid(id).catch(() => {})
        }
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }))
        if (get().apiAvailable) {
          api.markNotificationRead(id).catch(() => {})
        }
      },

      clearNotifications: () => {
        set({ notifications: [] })
        if (get().apiAvailable) {
          api.clearNotifications().catch(() => {})
        }
      },

      refreshNotifications: () => {
        if (get().apiAvailable) {
          api.refreshNotifications().then((notifs) => {
            set({
              notifications: notifs.map((n) => ({
                id: n.id,
                kind: n.kind as AppNotification['kind'],
                title: n.title,
                message: n.message ?? '',
                serviceId: n.serviceId ?? undefined,
                createdAt: n.createdAt,
                read: n.read,
              })),
            })
          }).catch(() => {
            // Fallback to local computation
            set((state) => ({
              services: state.services.map((s) => ({ ...s, status: deriveStatus(s) })),
              notifications: buildNotificationsFromServices(state.services),
            }))
          })
        } else {
          set((state) => ({
            services: state.services.map((s) => ({ ...s, status: deriveStatus(s) })),
            notifications: buildNotificationsFromServices(state.services),
          }))
        }
      },

      // ── OAuth connections ──────────────────────────────────────────────────

      addOAuthConnection: (conn) =>
        set((state) => ({
          oauthConnections: [...state.oauthConnections.filter((c) => c.id !== conn.id), conn],
        })),

      updateOAuthConnection: (id, patch) =>
        set((state) => ({
          oauthConnections: state.oauthConnections.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      removeOAuthConnection: (id) =>
        set((state) => ({
          oauthConnections: state.oauthConnections.filter((c) => c.id !== id),
          services: state.services.map((s) =>
            s.oauthConnectionId === id
              ? { ...s, oauthConnectionId: undefined, integrationTier: 'none' as const }
              : s
          ),
        })),

      revokeOAuthConnection: (id) =>
        set((state) => ({
          oauthConnections: state.oauthConnections.map((c) =>
            c.id === id ? { ...c, status: 'revoked' as const } : c
          ),
        })),

      resetDemoData: () =>
        set({
          paymentMethods: seedPaymentMethods,
          services: seedServices.map((s) => ({ ...s, status: deriveStatus(s) })),
          notifications: buildNotificationsFromServices(seedServices),
        }),
    }),
    { name: 'paynest-storage', version: 2 }
  )
)

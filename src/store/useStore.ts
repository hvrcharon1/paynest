import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppNotification, ExternalService, OAuthConnection, PaymentMethod } from '@/types'
import { seedPaymentMethods, seedServices } from '@/data/mockData'
import { computeNextDueDate, daysUntil, generateId } from '@/lib/utils'

interface AppState {
  paymentMethods: PaymentMethod[]
  services: ExternalService[]
  notifications: AppNotification[]
  oauthConnections: OAuthConnection[]
  hasOnboarded: boolean

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
    (set) => ({
      paymentMethods: seedPaymentMethods,
      services: seedServices.map((s) => ({ ...s, status: deriveStatus(s) })),
      notifications: buildNotificationsFromServices(seedServices),
      oauthConnections: [],
      hasOnboarded: true,

      addPaymentMethod: (pm) =>
        set((state) => ({
          paymentMethods: [
            ...state.paymentMethods.map((p) => (pm.isDefault ? { ...p, isDefault: false } : p)),
            { ...pm, id: generateId('pm'), createdAt: new Date().toISOString() },
          ],
        })),

      removePaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.filter((p) => p.id !== id),
        })),

      setDefaultPaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.map((p) => ({ ...p, isDefault: p.id === id })),
        })),

      addService: (svc) =>
        set((state) => {
          const nextDueDate = computeNextDueDate(svc.dueDay, svc.frequency)
          const newSvc: ExternalService = {
            ...svc,
            id: generateId('svc'),
            createdAt: new Date().toISOString(),
            nextDueDate,
            status: 'active',
          }
          return { services: [...state.services, newSvc] }
        }),

      updateService: (id, patch) =>
        set((state) => ({
          services: state.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),

      removeService: (id) =>
        set((state) => ({
          services: state.services.filter((s) => s.id !== id),
        })),

      toggleAutopay: (id) =>
        set((state) => ({
          services: state.services.map((s) => (s.id === id ? { ...s, autopayEnabled: !s.autopayEnabled } : s)),
        })),

      markPaid: (id) =>
        set((state) => ({
          services: state.services.map((s) => {
            if (s.id !== id) return s
            const next = computeNextDueDate(s.dueDay, s.frequency, new Date(Date.now() + 86400000))
            return { ...s, lastPaidAt: new Date().toISOString(), nextDueDate: next, status: 'active' }
          }),
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      clearNotifications: () => set({ notifications: [] }),

      refreshNotifications: () =>
        set((state) => ({
          services: state.services.map((s) => ({ ...s, status: deriveStatus(s) })),
          notifications: buildNotificationsFromServices(state.services),
        })),

      // ── OAuth connections ──────────────────────────────────────────────────

      addOAuthConnection: (conn) =>
        set((state) => ({
          // Replace if same id, otherwise append
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
          // Clear the reference from any service using this connection
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
    { name: 'paynest-storage', version: 1 }
  )
)

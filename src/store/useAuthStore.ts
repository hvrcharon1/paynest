import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, AuthProviderType } from '@/types'
import { generateId } from '@/lib/utils'
import { hashPassword } from '@/lib/auth'
import { signInWithGoogle as googleSignIn } from '@/lib/googleAuth'

/** Internal record — never exposed outside the store as-is (passwordHash stays in). */
interface StoredAccount {
  id: string
  name: string
  email: string
  /** SHA-256 hex digest. Empty for Google-only accounts (no local password). */
  passwordHash: string
  avatarUrl?: string
  createdAt: string
}

interface AuthState {
  accounts: StoredAccount[]
  user: AuthUser | null

  signUp: (input: { name: string; email: string; password: string }) => Promise<AuthUser>
  signIn: (input: { email: string; password: string }) => Promise<AuthUser>
  signInWithGoogle: () => Promise<AuthUser>
  signOut: () => void
}

function toAuthUser(account: StoredAccount, provider: AuthProviderType): AuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    avatarUrl: account.avatarUrl,
    provider,
    createdAt: account.createdAt,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      user: null,

      signUp: async ({ name, email, password }) => {
        const normalizedEmail = email.trim().toLowerCase()
        if (get().accounts.some((a) => a.email === normalizedEmail)) {
          throw new Error('An account with this email already exists. Try signing in instead.')
        }

        const account: StoredAccount = {
          id: generateId('user'),
          name: name.trim(),
          email: normalizedEmail,
          passwordHash: await hashPassword(password),
          createdAt: new Date().toISOString(),
        }

        const user = toAuthUser(account, 'email')
        set((state) => ({ accounts: [...state.accounts, account], user }))
        return user
      },

      signIn: async ({ email, password }) => {
        const normalizedEmail = email.trim().toLowerCase()
        const account = get().accounts.find((a) => a.email === normalizedEmail)
        if (!account) {
          throw new Error('No account found with that email. Try creating one instead.')
        }
        if (!account.passwordHash) {
          throw new Error('This account uses Google sign-in. Continue with Google below.')
        }

        const passwordHash = await hashPassword(password)
        if (passwordHash !== account.passwordHash) {
          throw new Error('Incorrect password. Please try again.')
        }

        const user = toAuthUser(account, 'email')
        set({ user })
        return user
      },

      signInWithGoogle: async () => {
        const profile = await googleSignIn()
        const normalizedEmail = profile.email.trim().toLowerCase()
        const existing = get().accounts.find((a) => a.email === normalizedEmail)

        const account: StoredAccount = existing
          ? { ...existing, avatarUrl: profile.picture ?? existing.avatarUrl }
          : {
              id: generateId('user'),
              name: profile.name,
              email: normalizedEmail,
              passwordHash: '',
              avatarUrl: profile.picture,
              createdAt: new Date().toISOString(),
            }

        set((state) => ({
          accounts: existing
            ? state.accounts.map((a) => (a.id === account.id ? account : a))
            : [...state.accounts, account],
        }))

        const user = toAuthUser(account, 'google')
        set({ user })
        return user
      },

      signOut: () => set({ user: null }),
    }),
    { name: 'paynest-auth', version: 1, partialize: (state) => ({ accounts: state.accounts, user: state.user }) }
  )
)

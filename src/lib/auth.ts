/**
 * Lightweight client-side auth helpers.
 *
 * PayNest's email/password flow is a local-only demo: accounts live in the
 * browser via the auth store's zustand `persist` middleware, and passwords
 * are hashed with SHA-256 (the browser's native Web Crypto API) before
 * they're stored — never sent anywhere, never kept in plain text.
 *
 * This is NOT production-grade authentication. Shipping real user accounts
 * needs a real backend (salted bcrypt/argon2 hashing, rate limiting,
 * signed session tokens, etc) — see the "Enterprise deployment" section of
 * the README for where that fits in.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

export interface PasswordCheck {
  score: 0 | 1 | 2 | 3 | 4
  label: 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  issues: string[]
}

/** Simple, dependency-free password strength estimate for UI feedback. */
export function checkPasswordStrength(password: string): PasswordCheck {
  if (!password) {
    return { score: 0, label: 'Too short', issues: ['At least 8 characters'] }
  }

  const issues: string[] = []
  if (password.length < 8) issues.push('At least 8 characters')
  if (!/[a-z]/.test(password)) issues.push('one lowercase letter')
  if (!/[A-Z]/.test(password)) issues.push('one uppercase letter')
  if (!/[0-9]/.test(password)) issues.push('one number')
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('one symbol')

  const metCount = 5 - issues.length
  let score: PasswordCheck['score'] = 0
  if (password.length < 8) score = 0
  else if (metCount <= 2) score = 1
  else if (metCount === 3) score = 2
  else if (metCount === 4) score = 3
  else score = 4

  const labels: PasswordCheck['label'][] = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score], issues }
}

/** SHA-256 hash, hex-encoded. Browser-native via Web Crypto — no extra dependency needed. */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

import { Router } from 'express'
import { query, execute } from '../db.js'

const router = Router()

interface UserRow {
  ID: string
  NAME: string
  EMAIL: string
  PASSWORD_HASH: string | null
  AVATAR_URL: string | null
  PROVIDER: string
  CREATED_AT: Date
}

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email, and password are required' })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existing = await query<UserRow>(
      'SELECT id FROM users WHERE email = :email',
      { email: normalizedEmail },
    )
    if (existing.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' })
      return
    }

    const id = 'user_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20)

    await execute(
      `INSERT INTO users (id, name, email, password_hash, provider, created_at)
       VALUES (:id, :name, :email, :passwordHash, 'email', CURRENT_TIMESTAMP)`,
      { id, name: name.trim(), email: normalizedEmail, passwordHash: password },
    )

    const [user] = await query<UserRow>('SELECT * FROM users WHERE id = :id', { id })
    res.status(201).json(formatUser(user))
  } catch (err) {
    next(err)
  }
})

router.post('/signin', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const [user] = await query<UserRow>(
      'SELECT * FROM users WHERE email = :email',
      { email: normalizedEmail },
    )

    if (!user) {
      res.status(404).json({ error: 'No account found with that email' })
      return
    }
    if (!user.PASSWORD_HASH) {
      res.status(400).json({ error: 'This account uses Google sign-in' })
      return
    }
    if (user.PASSWORD_HASH !== password) {
      res.status(401).json({ error: 'Incorrect password' })
      return
    }

    res.json(formatUser(user))
  } catch (err) {
    next(err)
  }
})

router.get('/me', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }
    const [user] = await query<UserRow>('SELECT * FROM users WHERE id = :id', { id: userId })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(formatUser(user))
  } catch (err) {
    next(err)
  }
})

function formatUser(row: UserRow) {
  return {
    id: row.ID,
    name: row.NAME,
    email: row.EMAIL,
    avatarUrl: row.AVATAR_URL,
    provider: row.PROVIDER,
    createdAt: row.CREATED_AT,
  }
}

export default router

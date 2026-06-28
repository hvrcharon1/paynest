import { Router } from 'express'
import { query, execute } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

interface PMRow {
  ID: string
  USER_ID: string
  TYPE: string
  LABEL: string
  IDENTIFIER: string
  BRAND: string | null
  EXPIRY: string | null
  IS_DEFAULT: number
  CREATED_AT: Date
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await query<PMRow>(
      'SELECT * FROM payment_methods WHERE user_id = :userId ORDER BY created_at',
      { userId: req.userId },
    )
    res.json(rows.map(formatPM))
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { type, label, identifier, brand, expiry, isDefault } = req.body
    if (!type || !label || !identifier) {
      res.status(400).json({ error: 'type, label, and identifier are required' })
      return
    }

    const id = 'pm_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20)

    if (isDefault) {
      await execute(
        'UPDATE payment_methods SET is_default = 0 WHERE user_id = :userId',
        { userId: req.userId },
      )
    }

    await execute(
      `INSERT INTO payment_methods (id, user_id, type, label, identifier, brand, expiry, is_default, created_at)
       VALUES (:id, :userId, :type, :label, :identifier, :brand, :expiry, :isDefault, CURRENT_TIMESTAMP)`,
      {
        id,
        userId: req.userId,
        type,
        label,
        identifier,
        brand: brand || null,
        expiry: expiry || null,
        isDefault: isDefault ? 1 : 0,
      },
    )

    const [row] = await query<PMRow>('SELECT * FROM payment_methods WHERE id = :id', { id })
    res.status(201).json(formatPM(row))
  } catch (err) {
    next(err)
  }
})

router.put('/:id/default', async (req, res, next) => {
  try {
    await execute(
      'UPDATE payment_methods SET is_default = 0 WHERE user_id = :userId',
      { userId: req.userId },
    )
    await execute(
      'UPDATE payment_methods SET is_default = 1 WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.userId },
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await execute(
      'DELETE FROM payment_methods WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.userId },
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

function formatPM(row: PMRow) {
  return {
    id: row.ID,
    type: row.TYPE,
    label: row.LABEL,
    identifier: row.IDENTIFIER,
    brand: row.BRAND,
    expiry: row.EXPIRY,
    isDefault: row.IS_DEFAULT === 1,
    createdAt: row.CREATED_AT,
  }
}

export default router

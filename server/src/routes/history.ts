import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

interface HistRow {
  ID: string
  SERVICE_ID: string
  USER_ID: string
  AMOUNT: number
  DUE_DATE: Date
  PAID_DATE: Date | null
  STATUS: string
  METHOD: string
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await query<HistRow>(
      `SELECT * FROM payment_history
       WHERE user_id = :userId
       ORDER BY due_date DESC
       FETCH FIRST 50 ROWS ONLY`,
      { userId: req.userId },
    )
    res.json(rows.map(formatHistory))
  } catch (err) {
    next(err)
  }
})

router.get('/service/:serviceId', async (req, res, next) => {
  try {
    const rows = await query<HistRow>(
      `SELECT * FROM payment_history
       WHERE user_id = :userId AND service_id = :serviceId
       ORDER BY due_date DESC`,
      { userId: req.userId, serviceId: req.params.serviceId },
    )
    res.json(rows.map(formatHistory))
  } catch (err) {
    next(err)
  }
})

function formatHistory(row: HistRow) {
  return {
    id: row.ID,
    serviceId: row.SERVICE_ID,
    amount: row.AMOUNT,
    dueDate: row.DUE_DATE,
    paidDate: row.PAID_DATE,
    status: row.STATUS,
    method: row.METHOD,
  }
}

export default router

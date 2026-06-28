import { Router } from 'express'
import { query, execute, callProcedure } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

interface NotifRow {
  ID: string
  USER_ID: string
  KIND: string
  TITLE: string
  MESSAGE: string | null
  SERVICE_ID: string | null
  CREATED_AT: Date
  IS_READ: number
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await query<NotifRow>(
      'SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC',
      { userId: req.userId },
    )
    res.json(rows.map(formatNotification))
  } catch (err) {
    next(err)
  }
})

router.post('/refresh', async (req, res, next) => {
  try {
    await callProcedure(
      'BEGIN paynest.paynest_api_pkg.refresh_notifications(:userId); END;',
      { userId: req.userId },
    )
    const rows = await query<NotifRow>(
      'SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC',
      { userId: req.userId },
    )
    res.json(rows.map(formatNotification))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/read', async (req, res, next) => {
  try {
    await execute(
      'UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.userId },
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.delete('/', async (req, res, next) => {
  try {
    await execute(
      'DELETE FROM notifications WHERE user_id = :userId',
      { userId: req.userId },
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

function formatNotification(row: NotifRow) {
  return {
    id: row.ID,
    kind: row.KIND,
    title: row.TITLE,
    message: row.MESSAGE,
    serviceId: row.SERVICE_ID,
    createdAt: row.CREATED_AT,
    read: row.IS_READ === 1,
  }
}

export default router

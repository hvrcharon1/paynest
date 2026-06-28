import { Router } from 'express'
import { query, callProcedure } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

interface InsightRow {
  ID: string
  USER_ID: string
  TITLE: string
  DETAIL: string | null
  SEVERITY: string
  CATEGORY: string | null
  GENERATED_AT: Date
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await query<InsightRow>(
      'SELECT * FROM ai_insights WHERE user_id = :userId ORDER BY generated_at DESC',
      { userId: req.userId },
    )
    res.json(rows.map(formatInsight))
  } catch (err) {
    next(err)
  }
})

router.post('/generate', async (req, res, next) => {
  try {
    await callProcedure(
      'BEGIN paynest.paynest_api_pkg.generate_insights(:userId); END;',
      { userId: req.userId },
    )
    const rows = await query<InsightRow>(
      'SELECT * FROM ai_insights WHERE user_id = :userId ORDER BY generated_at DESC',
      { userId: req.userId },
    )
    res.json(rows.map(formatInsight))
  } catch (err) {
    next(err)
  }
})

function formatInsight(row: InsightRow) {
  return {
    id: row.ID,
    title: row.TITLE,
    detail: row.DETAIL,
    severity: row.SEVERITY,
    category: row.CATEGORY,
    generatedAt: row.GENERATED_AT,
  }
}

export default router

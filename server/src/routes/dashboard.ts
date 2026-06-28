import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const [healthRow] = await query<{ SCORE: number }>(
      `SELECT GREATEST(0, LEAST(100,
        100
        - (SELECT COUNT(*) FROM external_services WHERE user_id = :userId AND status = 'overdue') * 14
        - (SELECT COUNT(*) FROM external_services WHERE user_id = :userId AND status = 'active' AND autopay_enabled = 0 AND (next_due_date - TRUNC(SYSDATE)) BETWEEN 0 AND 7) * 5
      )) AS score FROM dual`,
      { userId: req.userId },
    )
    const healthScore = healthRow?.SCORE ?? 100

    const [spending] = await query<{ TOTAL: number }>(
      `SELECT NVL(SUM(
        CASE frequency
          WHEN 'weekly' THEN amount * 52 / 12
          WHEN 'biweekly' THEN amount * 26 / 12
          WHEN 'monthly' THEN amount
          WHEN 'quarterly' THEN amount / 3
          WHEN 'annually' THEN amount / 12
          ELSE amount
        END
      ), 0) AS total
      FROM external_services
      WHERE user_id = :userId AND status != 'paused'`,
      { userId: req.userId },
    )

    const [counts] = await query<{ TOTAL_SERVICES: number; AUTOPAY_COUNT: number }>(
      `SELECT
        COUNT(*) AS total_services,
        SUM(CASE WHEN autopay_enabled = 1 THEN 1 ELSE 0 END) AS autopay_count
      FROM external_services
      WHERE user_id = :userId AND status != 'paused'`,
      { userId: req.userId },
    )

    const upcoming = await query<{ ID: string; PROVIDER_NAME: string; AMOUNT: number; NEXT_DUE_DATE: Date; AUTOPAY_ENABLED: number; CATEGORY: string }>(
      `SELECT id, provider_name, amount, next_due_date, autopay_enabled, category
       FROM external_services
       WHERE user_id = :userId AND status = 'active'
       ORDER BY next_due_date
       FETCH FIRST 5 ROWS ONLY`,
      { userId: req.userId },
    )

    const insights = await query<{ ID: string; TITLE: string; SEVERITY: string }>(
      `SELECT id, title, severity FROM ai_insights
       WHERE user_id = :userId
       ORDER BY generated_at DESC
       FETCH FIRST 3 ROWS ONLY`,
      { userId: req.userId },
    )

    const categoryBreakdown = await query<{ CATEGORY: string; MONTHLY_TOTAL: number }>(
      `SELECT category,
        SUM(CASE frequency
          WHEN 'weekly' THEN amount * 52 / 12
          WHEN 'biweekly' THEN amount * 26 / 12
          WHEN 'monthly' THEN amount
          WHEN 'quarterly' THEN amount / 3
          WHEN 'annually' THEN amount / 12
          ELSE amount
        END) AS monthly_total
      FROM external_services
      WHERE user_id = :userId AND status != 'paused'
      GROUP BY category
      ORDER BY monthly_total DESC`,
      { userId: req.userId },
    )

    res.json({
      healthScore,
      monthlySpend: spending?.TOTAL ?? 0,
      totalServices: counts?.TOTAL_SERVICES ?? 0,
      autopayCount: counts?.AUTOPAY_COUNT ?? 0,
      autopayPercentage: counts?.TOTAL_SERVICES
        ? Math.round(((counts.AUTOPAY_COUNT ?? 0) / counts.TOTAL_SERVICES) * 100)
        : 0,
      upcomingPayments: upcoming.map((r) => ({
        id: r.ID,
        providerName: r.PROVIDER_NAME,
        amount: r.AMOUNT,
        nextDueDate: r.NEXT_DUE_DATE,
        autopayEnabled: r.AUTOPAY_ENABLED === 1,
        category: r.CATEGORY,
      })),
      topInsights: insights.map((r) => ({
        id: r.ID,
        title: r.TITLE,
        severity: r.SEVERITY,
      })),
      categoryBreakdown: categoryBreakdown.map((r) => ({
        category: r.CATEGORY,
        monthlyTotal: r.MONTHLY_TOTAL,
      })),
    })
  } catch (err) {
    next(err)
  }
})

export default router

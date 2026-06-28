import { Router } from 'express'
import { query, execute, callProcedure } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

interface SvcRow {
  ID: string
  USER_ID: string
  CATEGORY: string
  PROVIDER_NAME: string
  ACCOUNT_REF: string | null
  PAYMENT_METHOD_ID: string | null
  AMOUNT: number
  FREQUENCY: string
  DUE_DAY: number
  AUTOPAY_ENABLED: number
  NOTIFY_DAYS_BEFORE: number
  STATUS: string
  LAST_PAID_AT: Date | null
  NEXT_DUE_DATE: Date
  CREATED_AT: Date
  NOTES: string | null
  INTEGRATION_TIER: string | null
  PORTAL_URL: string | null
  LOGIN_ID: string | null
  OAUTH_CONNECTION_ID: string | null
  CREDIT_LIMIT: number | null
  STATEMENT_BALANCE: number | null
  MINIMUM_PAYMENT: number | null
  APR: number | null
  CARD_PAYMENT_TYPE: string | null
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await query<SvcRow>(
      'SELECT * FROM external_services WHERE user_id = :userId ORDER BY next_due_date',
      { userId: req.userId },
    )
    res.json(rows.map(formatService))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const [row] = await query<SvcRow>(
      'SELECT * FROM external_services WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.userId },
    )
    if (!row) {
      res.status(404).json({ error: 'Service not found' })
      return
    }
    res.json(formatService(row))
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const {
      category, providerName, accountRef, paymentMethodId, amount,
      frequency, dueDay, autopayEnabled, notifyDaysBefore, notes,
      integrationTier, portalUrl, loginId, oauthConnectionId,
      creditLimit, statementBalance, minimumPayment, apr, cardPaymentType,
    } = req.body

    if (!category || !providerName || !amount || !frequency || !dueDay) {
      res.status(400).json({ error: 'category, providerName, amount, frequency, and dueDay are required' })
      return
    }

    const id = 'svc_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20)

    await execute(
      `INSERT INTO external_services (
        id, user_id, category, provider_name, account_ref, payment_method_id,
        amount, frequency, due_day, autopay_enabled, notify_days_before,
        status, next_due_date, created_at, notes,
        integration_tier, portal_url, login_id, oauth_connection_id,
        credit_limit, statement_balance, minimum_payment, apr, card_payment_type
      ) VALUES (
        :id, :userId, :category, :providerName, :accountRef, :paymentMethodId,
        :amount, :frequency, :dueDay, :autopayEnabled, :notifyDaysBefore,
        'active', paynest.paynest_api_pkg.next_due_date(:dueDay2, :frequency2), CURRENT_TIMESTAMP, :notes,
        :integrationTier, :portalUrl, :loginId, :oauthConnectionId,
        :creditLimit, :statementBalance, :minimumPayment, :apr, :cardPaymentType
      )`,
      {
        id,
        userId: req.userId,
        category,
        providerName,
        accountRef: accountRef || null,
        paymentMethodId: paymentMethodId || null,
        amount,
        frequency,
        dueDay,
        autopayEnabled: autopayEnabled ? 1 : 0,
        notifyDaysBefore: notifyDaysBefore ?? 3,
        notes: notes || null,
        integrationTier: integrationTier || 'none',
        portalUrl: portalUrl || null,
        loginId: loginId || null,
        oauthConnectionId: oauthConnectionId || null,
        creditLimit: creditLimit ?? null,
        statementBalance: statementBalance ?? null,
        minimumPayment: minimumPayment ?? null,
        apr: apr ?? null,
        cardPaymentType: cardPaymentType || null,
        dueDay2: dueDay,
        frequency2: frequency,
      },
    )

    const [row] = await query<SvcRow>('SELECT * FROM external_services WHERE id = :id', { id })
    res.status(201).json(formatService(row))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = [
      'category', 'providerName', 'accountRef', 'paymentMethodId', 'amount',
      'frequency', 'dueDay', 'autopayEnabled', 'notifyDaysBefore', 'status',
      'notes', 'integrationTier', 'portalUrl', 'loginId', 'oauthConnectionId',
      'creditLimit', 'statementBalance', 'minimumPayment', 'apr', 'cardPaymentType',
    ]

    const colMap: Record<string, string> = {
      providerName: 'provider_name',
      accountRef: 'account_ref',
      paymentMethodId: 'payment_method_id',
      dueDay: 'due_day',
      autopayEnabled: 'autopay_enabled',
      notifyDaysBefore: 'notify_days_before',
      integrationTier: 'integration_tier',
      portalUrl: 'portal_url',
      loginId: 'login_id',
      oauthConnectionId: 'oauth_connection_id',
      creditLimit: 'credit_limit',
      statementBalance: 'statement_balance',
      minimumPayment: 'minimum_payment',
      cardPaymentType: 'card_payment_type',
    }

    const sets: string[] = []
    const binds: Record<string, unknown> = { id: req.params.id, userId: req.userId }

    for (const key of allowed) {
      if (key in req.body) {
        const col = colMap[key] || key
        let val = req.body[key]
        if (key === 'autopayEnabled') val = val ? 1 : 0
        sets.push(`${col} = :${key}`)
        binds[key] = val ?? null
      }
    }

    if (sets.length === 0) {
      res.status(400).json({ error: 'No valid fields to update' })
      return
    }

    await execute(
      `UPDATE external_services SET ${sets.join(', ')} WHERE id = :id AND user_id = :userId`,
      binds,
    )

    const [row] = await query<SvcRow>(
      'SELECT * FROM external_services WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.userId },
    )
    res.json(formatService(row))
  } catch (err) {
    next(err)
  }
})

router.post('/:id/pay', async (req, res, next) => {
  try {
    await callProcedure(
      'BEGIN paynest.paynest_api_pkg.mark_service_paid(:serviceId, :userId); END;',
      { serviceId: req.params.id, userId: req.userId },
    )
    const [row] = await query<SvcRow>(
      'SELECT * FROM external_services WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.userId },
    )
    res.json(formatService(row))
  } catch (err) {
    next(err)
  }
})

router.post('/:id/toggle-autopay', async (req, res, next) => {
  try {
    await execute(
      `UPDATE external_services
       SET autopay_enabled = CASE WHEN autopay_enabled = 1 THEN 0 ELSE 1 END
       WHERE id = :id AND user_id = :userId`,
      { id: req.params.id, userId: req.userId },
    )
    const [row] = await query<SvcRow>(
      'SELECT * FROM external_services WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.userId },
    )
    res.json(formatService(row))
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await execute(
      'DELETE FROM external_services WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.userId },
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

function formatService(row: SvcRow) {
  return {
    id: row.ID,
    category: row.CATEGORY,
    providerName: row.PROVIDER_NAME,
    accountRef: row.ACCOUNT_REF,
    paymentMethodId: row.PAYMENT_METHOD_ID,
    amount: row.AMOUNT,
    frequency: row.FREQUENCY,
    dueDay: row.DUE_DAY,
    autopayEnabled: row.AUTOPAY_ENABLED === 1,
    notifyDaysBefore: row.NOTIFY_DAYS_BEFORE,
    status: row.STATUS,
    lastPaidAt: row.LAST_PAID_AT,
    nextDueDate: row.NEXT_DUE_DATE,
    createdAt: row.CREATED_AT,
    notes: row.NOTES,
    integrationTier: row.INTEGRATION_TIER,
    portalUrl: row.PORTAL_URL,
    loginId: row.LOGIN_ID,
    oauthConnectionId: row.OAUTH_CONNECTION_ID,
    creditLimit: row.CREDIT_LIMIT,
    statementBalance: row.STATEMENT_BALANCE,
    minimumPayment: row.MINIMUM_PAYMENT,
    apr: row.APR,
    cardPaymentType: row.CARD_PAYMENT_TYPE,
  }
}

export default router

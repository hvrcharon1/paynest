-- ============================================================
-- PayNest DB  |  Step 6: PAYNEST_API_PKG  (spec + body)
-- Run as   :  PAYNEST (schema owner)
-- Status   :  PENDING — run this script to complete setup
-- ============================================================

-- ── Package Specification ────────────────────────────────────
CREATE OR REPLACE PACKAGE paynest.paynest_api_pkg AS

  -- Compute next due date given a due-day and frequency.
  -- p_after_date defaults to today; advances beyond that date.
  FUNCTION next_due_date(
    p_due_day    IN NUMBER,
    p_frequency  IN VARCHAR2,
    p_after_date IN DATE DEFAULT TRUNC(SYSDATE)
  ) RETURN DATE;

  -- Rebuild notification rows for a user from their services.
  -- Deletes existing unread notifications then re-inserts.
  PROCEDURE refresh_notifications(p_user_id IN VARCHAR2);

  -- Mark a service as paid: advance next_due_date, insert payment_history row.
  PROCEDURE mark_service_paid(
    p_service_id IN VARCHAR2,
    p_user_id    IN VARCHAR2
  );

  -- Returns 0–100 payment health score.
  --   -14 per overdue service
  --   -5  per active non-autopay service due within 7 days
  FUNCTION payment_health_score(p_user_id IN VARCHAR2) RETURN NUMBER;

  -- Generate rules-based AI insight rows for a user.
  -- Clears insights older than 24 hours then inserts fresh ones.
  PROCEDURE generate_insights(p_user_id IN VARCHAR2);

END paynest_api_pkg;
/

-- ── Package Body ─────────────────────────────────────────────
CREATE OR REPLACE PACKAGE BODY paynest.paynest_api_pkg AS

  -- ──────────────────────────────────────────────────────────
  FUNCTION next_due_date(
    p_due_day    IN NUMBER,
    p_frequency  IN VARCHAR2,
    p_after_date IN DATE DEFAULT TRUNC(SYSDATE)
  ) RETURN DATE IS
    v_year      NUMBER;
    v_month     NUMBER;
    v_last_day  NUMBER;
    v_actual    NUMBER;
    v_candidate DATE;
  BEGIN
    -- weekly: next matching weekday (1=SUN..7=SAT in Oracle NEXT_DAY)
    IF p_frequency = 'weekly' THEN
      v_candidate := NEXT_DAY(p_after_date,
        DECODE(MOD(p_due_day - 1, 7),
          0, 'MONDAY', 1, 'TUESDAY', 2, 'WEDNESDAY',
          3, 'THURSDAY', 4, 'FRIDAY', 5, 'SATURDAY', 'SUNDAY'));
      RETURN v_candidate;

    ELSIF p_frequency = 'biweekly' THEN
      v_candidate := NEXT_DAY(p_after_date,
        DECODE(MOD(p_due_day - 1, 7),
          0, 'MONDAY', 1, 'TUESDAY', 2, 'WEDNESDAY',
          3, 'THURSDAY', 4, 'FRIDAY', 5, 'SATURDAY', 'SUNDAY'));
      RETURN v_candidate + 7;

    ELSIF p_frequency = 'one_time' THEN
      RETURN p_after_date + 3650;  -- far future sentinel

    ELSE
      -- monthly / quarterly / annually
      DECLARE
        v_months_add NUMBER := CASE p_frequency
                                 WHEN 'quarterly' THEN 3
                                 WHEN 'annually'  THEN 12
                                 ELSE 1
                               END;
      BEGIN
        v_year  := TO_NUMBER(TO_CHAR(p_after_date, 'YYYY'));
        v_month := TO_NUMBER(TO_CHAR(p_after_date, 'MM'));
        -- Clamp due_day to last day of this month
        v_last_day := TO_NUMBER(TO_CHAR(LAST_DAY(TRUNC(p_after_date, 'MM')), 'DD'));
        v_actual   := LEAST(p_due_day, v_last_day);
        v_candidate := TO_DATE(v_year || '-' || LPAD(v_month, 2, '0') || '-' ||
                               LPAD(v_actual, 2, '0'), 'YYYY-MM-DD');

        IF v_candidate <= p_after_date THEN
          -- Advance by the required months
          v_candidate := ADD_MONTHS(TRUNC(p_after_date, 'MM'), v_months_add);
          v_last_day  := TO_NUMBER(TO_CHAR(LAST_DAY(v_candidate), 'DD'));
          v_actual    := LEAST(p_due_day, v_last_day);
          v_candidate := TO_DATE(TO_CHAR(v_candidate, 'YYYY-MM') || '-' ||
                                 LPAD(v_actual, 2, '0'), 'YYYY-MM-DD');
        END IF;
        RETURN v_candidate;
      END;
    END IF;
  END next_due_date;

  -- ──────────────────────────────────────────────────────────
  PROCEDURE refresh_notifications(p_user_id IN VARCHAR2) IS
    v_days  NUMBER;
    v_id    VARCHAR2(50);
    CURSOR c_svcs IS
      SELECT id, provider_name, status, next_due_date,
             notify_days_before, autopay_enabled
      FROM   paynest.external_services
      WHERE  user_id = p_user_id AND status != 'paused';
  BEGIN
    DELETE FROM paynest.notifications
    WHERE  user_id = p_user_id AND read = 0;

    FOR r IN c_svcs LOOP
      v_days := TRUNC(r.next_due_date) - TRUNC(SYSDATE);

      IF r.status = 'overdue' THEN
        v_id := 'notif_' || LOWER(RAWTOHEX(SYS_GUID()));
        INSERT INTO paynest.notifications
               (id, user_id, kind, title, message, service_id, created_at, read)
        VALUES (v_id, p_user_id, 'overdue',
                r.provider_name || ' is overdue',
                'Payment was due ' || TO_CHAR(r.next_due_date, 'YYYY-MM-DD') || '.',
                r.id, CURRENT_TIMESTAMP, 0);

      ELSIF v_days >= 0 AND v_days <= r.notify_days_before THEN
        v_id := 'notif_' || LOWER(RAWTOHEX(SYS_GUID()));
        INSERT INTO paynest.notifications
               (id, user_id, kind, title, message, service_id, created_at, read)
        VALUES (v_id, p_user_id, 'due_soon',
                r.provider_name || ' due in ' || v_days || ' day' ||
                  CASE WHEN v_days = 1 THEN '' ELSE 's' END,
                CASE WHEN r.autopay_enabled = 1
                  THEN 'Autopay will charge on ' || TO_CHAR(r.next_due_date, 'YYYY-MM-DD') || '.'
                  ELSE 'No autopay — pay manually by ' || TO_CHAR(r.next_due_date, 'YYYY-MM-DD') || '.'
                END,
                r.id, CURRENT_TIMESTAMP, 0);
      END IF;
    END LOOP;
    COMMIT;
  END refresh_notifications;

  -- ──────────────────────────────────────────────────────────
  PROCEDURE mark_service_paid(
    p_service_id IN VARCHAR2,
    p_user_id    IN VARCHAR2
  ) IS
    v_svc     paynest.external_services%ROWTYPE;
    v_next    DATE;
    v_hist_id VARCHAR2(50);
  BEGIN
    SELECT * INTO v_svc
    FROM   paynest.external_services
    WHERE  id = p_service_id AND user_id = p_user_id
    FOR UPDATE;

    v_next := next_due_date(v_svc.due_day, v_svc.frequency, TRUNC(SYSDATE) + 1);

    UPDATE paynest.external_services
    SET    last_paid_at  = CURRENT_TIMESTAMP,
           next_due_date = v_next,
           status        = 'active'
    WHERE  id = p_service_id;

    v_hist_id := 'hist_' || LOWER(RAWTOHEX(SYS_GUID()));
    INSERT INTO paynest.payment_history
           (id, service_id, user_id, amount, due_date, paid_date, status, method)
    VALUES (v_hist_id, p_service_id, p_user_id,
            v_svc.amount, v_svc.next_due_date, TRUNC(SYSDATE),
            'paid',
            CASE WHEN v_svc.autopay_enabled = 1 THEN 'autopay' ELSE 'manual' END);
    COMMIT;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20001, 'Service not found: ' || p_service_id);
  END mark_service_paid;

  -- ──────────────────────────────────────────────────────────
  FUNCTION payment_health_score(p_user_id IN VARCHAR2) RETURN NUMBER IS
    v_overdue  NUMBER := 0;
    v_near_due NUMBER := 0;
  BEGIN
    SELECT COUNT(*) INTO v_overdue
    FROM   paynest.external_services
    WHERE  user_id = p_user_id AND status = 'overdue';

    SELECT COUNT(*) INTO v_near_due
    FROM   paynest.external_services
    WHERE  user_id = p_user_id
      AND  status           = 'active'
      AND  autopay_enabled  = 0
      AND  (next_due_date - TRUNC(SYSDATE)) BETWEEN 0 AND 7;

    RETURN GREATEST(0, LEAST(100, 100 - (v_overdue * 14) - (v_near_due * 5)));
  END payment_health_score;

  -- ──────────────────────────────────────────────────────────
  PROCEDURE generate_insights(p_user_id IN VARCHAR2) IS
    v_total    NUMBER := 0;
    v_score    NUMBER;
    v_overdue  NUMBER := 0;
    v_no_ap    NUMBER := 0;
    v_top_cat  VARCHAR2(50);
    v_top_pct  NUMBER;
    v_ins_id   VARCHAR2(50);

    FUNCTION monthly_amount(p_amt NUMBER, p_freq VARCHAR2) RETURN NUMBER IS
    BEGIN
      RETURN CASE p_freq
        WHEN 'weekly'    THEN p_amt * 52  / 12
        WHEN 'biweekly'  THEN p_amt * 26  / 12
        WHEN 'monthly'   THEN p_amt
        WHEN 'quarterly' THEN p_amt / 3
        WHEN 'annually'  THEN p_amt / 12
        ELSE p_amt
      END;
    END;
  BEGIN
    -- Remove stale insights (> 24 h)
    DELETE FROM paynest.ai_insights
    WHERE  user_id = p_user_id
      AND  generated_at < CURRENT_TIMESTAMP - INTERVAL '24' HOUR;

    SELECT NVL(SUM(monthly_amount(amount, frequency)), 0)
    INTO   v_total
    FROM   paynest.external_services
    WHERE  user_id = p_user_id AND status != 'paused';

    SELECT COUNT(*) INTO v_overdue
    FROM   paynest.external_services
    WHERE  user_id = p_user_id AND status = 'overdue';

    SELECT COUNT(*) INTO v_no_ap
    FROM   paynest.external_services
    WHERE  user_id = p_user_id AND status = 'active' AND autopay_enabled = 0;

    BEGIN
      SELECT category,
             ROUND(SUM(monthly_amount(amount, frequency)) / NULLIF(v_total, 0) * 100, 1)
      INTO   v_top_cat, v_top_pct
      FROM   paynest.external_services
      WHERE  user_id = p_user_id AND status != 'paused'
      GROUP  BY category
      ORDER  BY SUM(monthly_amount(amount, frequency)) DESC
      FETCH  FIRST 1 ROW ONLY;
    EXCEPTION WHEN NO_DATA_FOUND THEN v_top_cat := NULL; v_top_pct := 0;
    END;

    v_score := payment_health_score(p_user_id);

    -- 1. Monthly summary (always)
    IF v_total > 0 THEN
      v_ins_id := 'ins_' || LOWER(RAWTOHEX(SYS_GUID()));
      INSERT INTO paynest.ai_insights (id, user_id, title, detail, severity, category, generated_at)
      VALUES (v_ins_id, p_user_id,
        'Monthly outflow: $' || TO_CHAR(ROUND(v_total, 2), 'FM999,999.99'),
        'Estimated monthly outflow across all active services is $' ||
          TO_CHAR(ROUND(v_total, 2), 'FM999,999.99') ||
          '. Payment health score: ' || v_score || '/100.',
        'info', NULL, CURRENT_TIMESTAMP);
    END IF;

    -- 2. Overdue alert
    IF v_overdue > 0 THEN
      v_ins_id := 'ins_' || LOWER(RAWTOHEX(SYS_GUID()));
      INSERT INTO paynest.ai_insights (id, user_id, title, detail, severity, category, generated_at)
      VALUES (v_ins_id, p_user_id,
        v_overdue || ' overdue payment' || CASE WHEN v_overdue > 1 THEN 's' ELSE '' END,
        'You have ' || v_overdue ||
          ' overdue service(s). Late payments may incur penalty fees. Address them as soon as possible.',
        'critical', NULL, CURRENT_TIMESTAMP);
    END IF;

    -- 3. Autopay gap (> 2 services without autopay)
    IF v_no_ap > 2 THEN
      v_ins_id := 'ins_' || LOWER(RAWTOHEX(SYS_GUID()));
      INSERT INTO paynest.ai_insights (id, user_id, title, detail, severity, category, generated_at)
      VALUES (v_ins_id, p_user_id,
        'Enable autopay on ' || v_no_ap || ' services',
        'You have ' || v_no_ap ||
          ' active services without autopay. Enabling autopay reduces the risk of missed payments.',
        'warning', NULL, CURRENT_TIMESTAMP);
    END IF;

    -- 4. Category concentration (> 35 %)
    IF v_top_cat IS NOT NULL AND v_top_pct > 35 THEN
      v_ins_id := 'ins_' || LOWER(RAWTOHEX(SYS_GUID()));
      INSERT INTO paynest.ai_insights (id, user_id, title, detail, severity, category, generated_at)
      VALUES (v_ins_id, p_user_id,
        INITCAP(REPLACE(v_top_cat, '_', ' ')) || ' is ' || v_top_pct || '% of monthly spend',
        'Your ' || REPLACE(v_top_cat, '_', ' ') || ' expenses represent ' || v_top_pct ||
          '% of total monthly outflow ($' || TO_CHAR(ROUND(v_total, 2), 'FM999,999.99') ||
          '). Review if this category can be optimised.',
        'warning', v_top_cat, CURRENT_TIMESTAMP);
    END IF;

    COMMIT;
  END generate_insights;

END paynest_api_pkg;
/

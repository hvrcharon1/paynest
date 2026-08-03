-- ============================================================
-- PayNest  |  OCI Autonomous Database Setup
-- Run as   :  ADMIN  (Autonomous Database admin user)
-- Purpose  :  Creates all users, schema objects, indexes,
--             grants, and the PL/SQL package in one pass.
--
-- ADB differences from local Oracle 23ai Free:
--   - No custom tablespaces (ADB uses DATA; all TABLESPACE
--     clauses removed)
--   - RESOURCE role not available; replaced with individual
--     system privileges
--   - TEMPORARY TABLESPACE clause omitted in CREATE USER
--     (ADB assigns TEMP automatically)
--   - paynest_admin skipped (ADMIN itself is the DBA)
-- ============================================================


-- ============================================================
-- SECTION 1 : Users
-- ============================================================

-- Schema owner — owns all tables, indexes, and the PL/SQL package
CREATE USER paynest IDENTIFIED BY "Herschel@1792"
  DEFAULT TABLESPACE DATA
  QUOTA UNLIMITED ON DATA;

-- Grant the privileges RESOURCE would have given on standard Oracle
GRANT CREATE SESSION     TO paynest;
GRANT CREATE TABLE       TO paynest;
GRANT CREATE VIEW        TO paynest;
GRANT CREATE SEQUENCE    TO paynest;
GRANT CREATE PROCEDURE   TO paynest;
GRANT CREATE TRIGGER     TO paynest;
GRANT CREATE TYPE        TO paynest;

-- API runtime user (used by the Node.js / Express backend)
CREATE USER paynest_app IDENTIFIED BY "Herschel@1792"
  DEFAULT TABLESPACE DATA
  QUOTA UNLIMITED ON DATA;

GRANT CREATE SESSION TO paynest_app;

-- Read-only / analytics user
CREATE USER paynest_ro IDENTIFIED BY "Herschel@1792"
  DEFAULT TABLESPACE DATA;

GRANT CREATE SESSION TO paynest_ro;


-- ============================================================
-- SECTION 2 : Tables  (owned by PAYNEST, created by ADMIN)
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE paynest.users (
  id            VARCHAR2(50)  NOT NULL,
  name          VARCHAR2(255) NOT NULL,
  email         VARCHAR2(255) NOT NULL,
  password_hash VARCHAR2(255),
  avatar_url    VARCHAR2(500),
  provider      VARCHAR2(20)  DEFAULT 'email' NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pk_users           PRIMARY KEY (id),
  CONSTRAINT uq_users_email     UNIQUE (email),
  CONSTRAINT chk_users_provider CHECK (provider IN ('email', 'google'))
);

-- ── PAYMENT_METHODS ──────────────────────────────────────────
CREATE TABLE paynest.payment_methods (
  id         VARCHAR2(50)  NOT NULL,
  user_id    VARCHAR2(50)  NOT NULL,
  type       VARCHAR2(20)  NOT NULL,
  label      VARCHAR2(100) NOT NULL,
  identifier VARCHAR2(50)  NOT NULL,
  brand      VARCHAR2(50),
  expiry     VARCHAR2(10),
  is_default NUMBER(1)     DEFAULT 0 NOT NULL,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pk_payment_methods PRIMARY KEY (id),
  CONSTRAINT fk_pm_user         FOREIGN KEY (user_id) REFERENCES paynest.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_pm_type        CHECK (type       IN ('card', 'bank_account', 'wallet')),
  CONSTRAINT chk_pm_default     CHECK (is_default IN (0, 1))
);

-- ── OAUTH_CONNECTIONS ─────────────────────────────────────────
CREATE TABLE paynest.oauth_connections (
  id            VARCHAR2(50)   NOT NULL,
  user_id       VARCHAR2(50)   NOT NULL,
  provider_id   VARCHAR2(50)   NOT NULL,
  provider_name VARCHAR2(100)  NOT NULL,
  client_id     VARCHAR2(255),
  access_token  VARCHAR2(2000),
  refresh_token VARCHAR2(2000),
  expires_at    TIMESTAMP,
  scope         VARCHAR2(500),
  status        VARCHAR2(20)   DEFAULT 'active' NOT NULL,
  connected_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
  is_local_only NUMBER(1)      DEFAULT 1 NOT NULL,
  CONSTRAINT pk_oauth_conn     PRIMARY KEY (id),
  CONSTRAINT fk_oauth_user     FOREIGN KEY (user_id) REFERENCES paynest.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_oauth_status  CHECK (status        IN ('active', 'expired', 'revoked')),
  CONSTRAINT chk_oauth_local   CHECK (is_local_only IN (0, 1))
);

-- ── EXTERNAL_SERVICES ─────────────────────────────────────────
CREATE TABLE paynest.external_services (
  id                  VARCHAR2(50)    NOT NULL,
  user_id             VARCHAR2(50)    NOT NULL,
  category            VARCHAR2(50)    NOT NULL,
  provider_name       VARCHAR2(255)   NOT NULL,
  account_ref         VARCHAR2(255),
  payment_method_id   VARCHAR2(50),
  amount              NUMBER(12, 2)   NOT NULL,
  frequency           VARCHAR2(20)    NOT NULL,
  due_day             NUMBER(2)       NOT NULL,
  autopay_enabled     NUMBER(1)       DEFAULT 0 NOT NULL,
  notify_days_before  NUMBER(3)       DEFAULT 3 NOT NULL,
  status              VARCHAR2(20)    DEFAULT 'active' NOT NULL,
  last_paid_at        TIMESTAMP,
  next_due_date       DATE            NOT NULL,
  created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,
  notes               CLOB,
  integration_tier    VARCHAR2(20)    DEFAULT 'none',
  portal_url          VARCHAR2(1000),
  login_id            VARCHAR2(255),
  oauth_connection_id VARCHAR2(50),
  credit_limit        NUMBER(12, 2),
  statement_balance   NUMBER(12, 2),
  minimum_payment     NUMBER(10, 2),
  apr                 NUMBER(5, 2),
  card_payment_type   VARCHAR2(20),
  CONSTRAINT pk_services     PRIMARY KEY (id),
  CONSTRAINT fk_svc_user     FOREIGN KEY (user_id)             REFERENCES paynest.users(id)             ON DELETE CASCADE,
  CONSTRAINT fk_svc_pm       FOREIGN KEY (payment_method_id)   REFERENCES paynest.payment_methods(id)   ON DELETE SET NULL,
  CONSTRAINT fk_svc_oauth    FOREIGN KEY (oauth_connection_id) REFERENCES paynest.oauth_connections(id) ON DELETE SET NULL,
  CONSTRAINT chk_svc_status  CHECK (status           IN ('active', 'paused', 'overdue')),
  CONSTRAINT chk_svc_freq    CHECK (frequency        IN ('monthly', 'weekly', 'biweekly', 'quarterly', 'annually', 'one_time')),
  CONSTRAINT chk_svc_tier    CHECK (integration_tier IN ('none', 'portal', 'oauth')),
  CONSTRAINT chk_svc_cpt     CHECK (card_payment_type IN ('minimum', 'statement', 'custom') OR card_payment_type IS NULL),
  CONSTRAINT chk_svc_due_day CHECK (due_day BETWEEN 1 AND 31),
  CONSTRAINT chk_svc_autopay CHECK (autopay_enabled  IN (0, 1))
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE TABLE paynest.notifications (
  id         VARCHAR2(50)   NOT NULL,
  user_id    VARCHAR2(50)   NOT NULL,
  kind       VARCHAR2(30)   NOT NULL,
  title      VARCHAR2(255)  NOT NULL,
  message    VARCHAR2(1000),
  service_id VARCHAR2(50),
  created_at TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
  is_read    NUMBER(1)      DEFAULT 0 NOT NULL,
  CONSTRAINT pk_notifications PRIMARY KEY (id),
  CONSTRAINT fk_notif_user    FOREIGN KEY (user_id)    REFERENCES paynest.users(id)            ON DELETE CASCADE,
  CONSTRAINT fk_notif_svc     FOREIGN KEY (service_id) REFERENCES paynest.external_services(id) ON DELETE SET NULL,
  CONSTRAINT chk_notif_kind   CHECK (kind    IN ('due_soon', 'overdue', 'autopay_success', 'autopay_failed', 'ai_insight')),
  CONSTRAINT chk_notif_read   CHECK (is_read IN (0, 1))
);

-- ── PAYMENT_HISTORY ───────────────────────────────────────────
CREATE TABLE paynest.payment_history (
  id         VARCHAR2(50)  NOT NULL,
  service_id VARCHAR2(50)  NOT NULL,
  user_id    VARCHAR2(50)  NOT NULL,
  amount     NUMBER(12, 2) NOT NULL,
  due_date   DATE          NOT NULL,
  paid_date  DATE,
  status     VARCHAR2(20)  NOT NULL,
  method     VARCHAR2(20)  DEFAULT 'manual' NOT NULL,
  CONSTRAINT pk_payment_history PRIMARY KEY (id),
  CONSTRAINT fk_hist_svc        FOREIGN KEY (service_id) REFERENCES paynest.external_services(id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_user       FOREIGN KEY (user_id)    REFERENCES paynest.users(id)             ON DELETE CASCADE,
  CONSTRAINT chk_hist_status    CHECK (status IN ('upcoming', 'paid', 'failed', 'overdue')),
  CONSTRAINT chk_hist_method    CHECK (method IN ('autopay', 'manual'))
);

-- ── AI_INSIGHTS ───────────────────────────────────────────────
CREATE TABLE paynest.ai_insights (
  id           VARCHAR2(50)  NOT NULL,
  user_id      VARCHAR2(50)  NOT NULL,
  title        VARCHAR2(255) NOT NULL,
  detail       CLOB,
  severity     VARCHAR2(20)  DEFAULT 'info' NOT NULL,
  category     VARCHAR2(50),
  generated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pk_ai_insights       PRIMARY KEY (id),
  CONSTRAINT fk_insights_user     FOREIGN KEY (user_id) REFERENCES paynest.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_insight_severity CHECK (severity IN ('info', 'warning', 'critical'))
);


-- ============================================================
-- SECTION 3 : Indexes
-- ============================================================

CREATE INDEX idx_pm_user_id    ON paynest.payment_methods   (user_id);
CREATE INDEX idx_oauth_user_id ON paynest.oauth_connections  (user_id);
CREATE INDEX idx_svc_user_id   ON paynest.external_services  (user_id);
CREATE INDEX idx_svc_next_due  ON paynest.external_services  (user_id, next_due_date);
CREATE INDEX idx_svc_status    ON paynest.external_services  (user_id, status);
CREATE INDEX idx_notif_user_id ON paynest.notifications      (user_id, is_read);
CREATE INDEX idx_hist_user_id  ON paynest.payment_history     (user_id);
CREATE INDEX idx_insights_user ON paynest.ai_insights         (user_id, generated_at DESC);


-- ============================================================
-- SECTION 4 : DML Grants to PAYNEST_APP
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.users             TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.payment_methods   TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.external_services TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.oauth_connections TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.notifications     TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.payment_history   TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.ai_insights       TO paynest_app;


-- ============================================================
-- SECTION 5 : SELECT Grants to PAYNEST_RO
-- ============================================================

GRANT SELECT ON paynest.users             TO paynest_ro;
GRANT SELECT ON paynest.payment_methods   TO paynest_ro;
GRANT SELECT ON paynest.external_services TO paynest_ro;
GRANT SELECT ON paynest.oauth_connections TO paynest_ro;
GRANT SELECT ON paynest.notifications     TO paynest_ro;
GRANT SELECT ON paynest.payment_history   TO paynest_ro;
GRANT SELECT ON paynest.ai_insights       TO paynest_ro;


-- ============================================================
-- SECTION 6 : PL/SQL Package
-- ============================================================

CREATE OR REPLACE PACKAGE paynest.paynest_api_pkg AS

  FUNCTION next_due_date(
    p_due_day    IN NUMBER,
    p_frequency  IN VARCHAR2,
    p_after_date IN DATE DEFAULT TRUNC(SYSDATE)
  ) RETURN DATE;

  PROCEDURE refresh_notifications(p_user_id IN VARCHAR2);

  PROCEDURE mark_service_paid(
    p_service_id IN VARCHAR2,
    p_user_id    IN VARCHAR2
  );

  FUNCTION payment_health_score(p_user_id IN VARCHAR2) RETURN NUMBER;

  PROCEDURE generate_insights(p_user_id IN VARCHAR2);

END paynest_api_pkg;
/

CREATE OR REPLACE PACKAGE BODY paynest.paynest_api_pkg AS

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
      RETURN p_after_date + 3650;

    ELSE
      DECLARE
        v_months_add NUMBER := CASE p_frequency
                                 WHEN 'quarterly' THEN 3
                                 WHEN 'annually'  THEN 12
                                 ELSE 1
                               END;
      BEGIN
        v_year  := TO_NUMBER(TO_CHAR(p_after_date, 'YYYY'));
        v_month := TO_NUMBER(TO_CHAR(p_after_date, 'MM'));
        v_last_day := TO_NUMBER(TO_CHAR(LAST_DAY(TRUNC(p_after_date, 'MM')), 'DD'));
        v_actual   := LEAST(p_due_day, v_last_day);
        v_candidate := TO_DATE(v_year || '-' || LPAD(v_month, 2, '0') || '-' ||
                               LPAD(v_actual, 2, '0'), 'YYYY-MM-DD');

        IF v_candidate <= p_after_date THEN
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
    WHERE  user_id = p_user_id AND is_read = 0;

    FOR r IN c_svcs LOOP
      v_days := TRUNC(r.next_due_date) - TRUNC(SYSDATE);

      IF r.status = 'overdue' THEN
        v_id := 'notif_' || LOWER(RAWTOHEX(SYS_GUID()));
        INSERT INTO paynest.notifications
               (id, user_id, kind, title, message, service_id, created_at, is_read)
        VALUES (v_id, p_user_id, 'overdue',
                r.provider_name || ' is overdue',
                'Payment was due ' || TO_CHAR(r.next_due_date, 'YYYY-MM-DD') || '.',
                r.id, CURRENT_TIMESTAMP, 0);

      ELSIF v_days >= 0 AND v_days <= r.notify_days_before THEN
        v_id := 'notif_' || LOWER(RAWTOHEX(SYS_GUID()));
        INSERT INTO paynest.notifications
               (id, user_id, kind, title, message, service_id, created_at, is_read)
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

    IF v_overdue > 0 THEN
      v_ins_id := 'ins_' || LOWER(RAWTOHEX(SYS_GUID()));
      INSERT INTO paynest.ai_insights (id, user_id, title, detail, severity, category, generated_at)
      VALUES (v_ins_id, p_user_id,
        v_overdue || ' overdue payment' || CASE WHEN v_overdue > 1 THEN 's' ELSE '' END,
        'You have ' || v_overdue ||
          ' overdue service(s). Late payments may incur penalty fees. Address them as soon as possible.',
        'critical', NULL, CURRENT_TIMESTAMP);
    END IF;

    IF v_no_ap > 2 THEN
      v_ins_id := 'ins_' || LOWER(RAWTOHEX(SYS_GUID()));
      INSERT INTO paynest.ai_insights (id, user_id, title, detail, severity, category, generated_at)
      VALUES (v_ins_id, p_user_id,
        'Enable autopay on ' || v_no_ap || ' services',
        'You have ' || v_no_ap ||
          ' active services without autopay. Enabling autopay reduces the risk of missed payments.',
        'warning', NULL, CURRENT_TIMESTAMP);
    END IF;

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


-- ============================================================
-- SECTION 7 : Package execute grant
-- (must run AFTER package is compiled)
-- ============================================================

GRANT EXECUTE ON paynest.paynest_api_pkg TO paynest_app;
GRANT EXECUTE ON paynest.paynest_api_pkg TO paynest_ro;


-- ============================================================
-- SECTION 8 : Verification queries
-- Run these after the script to confirm everything is in place.
-- ============================================================

-- Should return 7 rows (one per table)
SELECT table_name
FROM   all_tables
WHERE  owner = 'PAYNEST'
ORDER  BY table_name;

-- Should return 8 rows (one per index)
SELECT index_name, table_name
FROM   all_indexes
WHERE  table_owner = 'PAYNEST'
ORDER  BY index_name;

-- Should return VALID for both PACKAGE and PACKAGE BODY
SELECT object_name, object_type, status
FROM   all_objects
WHERE  owner = 'PAYNEST'
  AND  object_type IN ('PACKAGE', 'PACKAGE BODY')
ORDER  BY object_type;

-- Should show 3 users created
SELECT username, account_status, default_tablespace
FROM   dba_users
WHERE  username IN ('PAYNEST', 'PAYNEST_APP', 'PAYNEST_RO')
ORDER  BY username;

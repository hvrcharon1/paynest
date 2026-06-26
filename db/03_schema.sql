-- ============================================================
-- PayNest DB  |  Step 3: Schema Objects  (tables + indexes)
-- Run as   :  SYS AS SYSDBA  (or connect as PAYNEST)
-- Status   :  ALREADY APPLIED (2026-06-25 via MCP)
-- ============================================================

-- ── USERS ───────────────────────────────────────────────────
CREATE TABLE paynest.users (
  id            VARCHAR2(50)  NOT NULL,
  name          VARCHAR2(255) NOT NULL,
  email         VARCHAR2(255) NOT NULL,
  password_hash VARCHAR2(255),                      -- NULL for Google-only accounts
  avatar_url    VARCHAR2(500),
  provider      VARCHAR2(20)  DEFAULT 'email' NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pk_users          PRIMARY KEY (id)    USING INDEX TABLESPACE paynest_idx,
  CONSTRAINT uq_users_email    UNIQUE (email)      USING INDEX TABLESPACE paynest_idx,
  CONSTRAINT chk_users_provider CHECK (provider IN ('email', 'google'))
) TABLESPACE paynest_data;

-- ── PAYMENT_METHODS ─────────────────────────────────────────
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
  CONSTRAINT pk_payment_methods PRIMARY KEY (id)   USING INDEX TABLESPACE paynest_idx,
  CONSTRAINT fk_pm_user  FOREIGN KEY (user_id) REFERENCES paynest.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_pm_type    CHECK (type       IN ('card', 'bank_account', 'wallet')),
  CONSTRAINT chk_pm_default CHECK (is_default IN (0, 1))
) TABLESPACE paynest_data;

-- ── OAUTH_CONNECTIONS ────────────────────────────────────────
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
  CONSTRAINT pk_oauth_conn  PRIMARY KEY (id)     USING INDEX TABLESPACE paynest_idx,
  CONSTRAINT fk_oauth_user  FOREIGN KEY (user_id) REFERENCES paynest.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_oauth_status  CHECK (status       IN ('active', 'expired', 'revoked')),
  CONSTRAINT chk_oauth_local   CHECK (is_local_only IN (0, 1))
) TABLESPACE paynest_data;

-- ── EXTERNAL_SERVICES ────────────────────────────────────────
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
  CONSTRAINT pk_services      PRIMARY KEY (id)                USING INDEX TABLESPACE paynest_idx,
  CONSTRAINT fk_svc_user      FOREIGN KEY (user_id)           REFERENCES paynest.users(id)             ON DELETE CASCADE,
  CONSTRAINT fk_svc_pm        FOREIGN KEY (payment_method_id) REFERENCES paynest.payment_methods(id)   ON DELETE SET NULL,
  CONSTRAINT fk_svc_oauth     FOREIGN KEY (oauth_connection_id) REFERENCES paynest.oauth_connections(id) ON DELETE SET NULL,
  CONSTRAINT chk_svc_status   CHECK (status           IN ('active', 'paused', 'overdue')),
  CONSTRAINT chk_svc_freq     CHECK (frequency        IN ('monthly', 'weekly', 'biweekly', 'quarterly', 'annually', 'one_time')),
  CONSTRAINT chk_svc_tier     CHECK (integration_tier IN ('none', 'portal', 'oauth')),
  CONSTRAINT chk_svc_cpt      CHECK (card_payment_type IN ('minimum', 'statement', 'custom') OR card_payment_type IS NULL),
  CONSTRAINT chk_svc_due_day  CHECK (due_day BETWEEN 1 AND 31),
  CONSTRAINT chk_svc_autopay  CHECK (autopay_enabled IN (0, 1))
) TABLESPACE paynest_data;

-- ── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE paynest.notifications (
  id         VARCHAR2(50)   NOT NULL,
  user_id    VARCHAR2(50)   NOT NULL,
  kind       VARCHAR2(30)   NOT NULL,
  title      VARCHAR2(255)  NOT NULL,
  message    VARCHAR2(1000),
  service_id VARCHAR2(50),
  created_at TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
  read       NUMBER(1)      DEFAULT 0 NOT NULL,
  CONSTRAINT pk_notifications  PRIMARY KEY (id)         USING INDEX TABLESPACE paynest_idx,
  CONSTRAINT fk_notif_user     FOREIGN KEY (user_id)    REFERENCES paynest.users(id)             ON DELETE CASCADE,
  CONSTRAINT fk_notif_svc      FOREIGN KEY (service_id) REFERENCES paynest.external_services(id)  ON DELETE SET NULL,
  CONSTRAINT chk_notif_kind    CHECK (kind IN ('due_soon', 'overdue', 'autopay_success', 'autopay_failed', 'ai_insight')),
  CONSTRAINT chk_notif_read    CHECK (read IN (0, 1))
) TABLESPACE paynest_data;

-- ── PAYMENT_HISTORY ──────────────────────────────────────────
CREATE TABLE paynest.payment_history (
  id         VARCHAR2(50)  NOT NULL,
  service_id VARCHAR2(50)  NOT NULL,
  user_id    VARCHAR2(50)  NOT NULL,
  amount     NUMBER(12, 2) NOT NULL,
  due_date   DATE          NOT NULL,
  paid_date  DATE,
  status     VARCHAR2(20)  NOT NULL,
  method     VARCHAR2(20)  DEFAULT 'manual' NOT NULL,
  CONSTRAINT pk_payment_history PRIMARY KEY (id)         USING INDEX TABLESPACE paynest_idx,
  CONSTRAINT fk_hist_svc        FOREIGN KEY (service_id) REFERENCES paynest.external_services(id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_user       FOREIGN KEY (user_id)    REFERENCES paynest.users(id)             ON DELETE CASCADE,
  CONSTRAINT chk_hist_status    CHECK (status IN ('upcoming', 'paid', 'failed', 'overdue')),
  CONSTRAINT chk_hist_method    CHECK (method IN ('autopay', 'manual'))
) TABLESPACE paynest_data;

-- ── AI_INSIGHTS ──────────────────────────────────────────────
CREATE TABLE paynest.ai_insights (
  id           VARCHAR2(50)  NOT NULL,
  user_id      VARCHAR2(50)  NOT NULL,
  title        VARCHAR2(255) NOT NULL,
  detail       CLOB,
  severity     VARCHAR2(20)  DEFAULT 'info' NOT NULL,
  category     VARCHAR2(50),
  generated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pk_ai_insights      PRIMARY KEY (id)      USING INDEX TABLESPACE paynest_idx,
  CONSTRAINT fk_insights_user    FOREIGN KEY (user_id) REFERENCES paynest.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_insight_severity CHECK (severity IN ('info', 'warning', 'critical'))
) TABLESPACE paynest_data;

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX idx_pm_user_id      ON paynest.payment_methods   (user_id)                          TABLESPACE paynest_idx;
CREATE INDEX idx_oauth_user_id   ON paynest.oauth_connections  (user_id)                          TABLESPACE paynest_idx;
CREATE INDEX idx_svc_user_id     ON paynest.external_services  (user_id)                          TABLESPACE paynest_idx;
CREATE INDEX idx_svc_next_due    ON paynest.external_services  (user_id, next_due_date)            TABLESPACE paynest_idx;
CREATE INDEX idx_svc_status      ON paynest.external_services  (user_id, status)                  TABLESPACE paynest_idx;
CREATE INDEX idx_notif_user_id   ON paynest.notifications      (user_id, read)                    TABLESPACE paynest_idx;
CREATE INDEX idx_hist_user_id    ON paynest.payment_history     (user_id)                          TABLESPACE paynest_idx;
CREATE INDEX idx_insights_user   ON paynest.ai_insights         (user_id, generated_at DESC)       TABLESPACE paynest_idx;

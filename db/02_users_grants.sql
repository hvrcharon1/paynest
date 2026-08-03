-- ============================================================
-- PayNest DB  |  Step 2: Users & Role Grants
-- Run as   :  SYS AS SYSDBA  (connected to FREEPDB1)
-- Status   :  ALREADY APPLIED (2026-06-25 via MCP)
-- ============================================================

-- ── Schema owner ────────────────────────────────────────────
-- Replace <paynest_schema_password> with your chosen password before running.
CREATE USER paynest IDENTIFIED BY "<paynest_schema_password>"
  DEFAULT TABLESPACE paynest_data
  TEMPORARY TABLESPACE temp
  QUOTA UNLIMITED ON paynest_data
  QUOTA UNLIMITED ON paynest_idx;

GRANT CONNECT, RESOURCE, CREATE VIEW, CREATE SEQUENCE,
      CREATE PROCEDURE, CREATE TRIGGER TO paynest;

-- ── API runtime user (minimal) ───────────────────────────────
-- Replace <paynest_app_password> with your chosen password before running.
CREATE USER paynest_app IDENTIFIED BY "<paynest_app_password>"
  DEFAULT TABLESPACE paynest_data
  TEMPORARY TABLESPACE temp;

GRANT CREATE SESSION TO paynest_app;

-- ── Read-only / analytics user ───────────────────────────────
CREATE USER paynest_ro IDENTIFIED BY "<paynest_ro_password>"
  DEFAULT TABLESPACE paynest_data
  TEMPORARY TABLESPACE temp;

GRANT CREATE SESSION TO paynest_ro;

-- ── DBA maintenance user ─────────────────────────────────────
CREATE USER paynest_admin IDENTIFIED BY "<paynest_admin_password>"
  DEFAULT TABLESPACE paynest_data
  TEMPORARY TABLESPACE temp;

GRANT DBA TO paynest_admin;

-- ============================================================
-- PayNest DB  |  Step 4: DML Grants to PAYNEST_APP
-- Run as   :  PAYNEST (schema owner)
-- Status   :  ALREADY APPLIED (2026-06-25 via MCP)
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.users             TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.payment_methods   TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.external_services TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.oauth_connections TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.notifications     TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.payment_history   TO paynest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paynest.ai_insights       TO paynest_app;

-- Allow API to call the PL/SQL package (run AFTER 06_plsql_package.sql)
GRANT EXECUTE ON paynest.paynest_api_pkg TO paynest_app;

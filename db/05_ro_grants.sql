-- ============================================================
-- PayNest DB  |  Step 5: SELECT Grants to PAYNEST_RO
-- Run as   :  PAYNEST (schema owner)
-- Status   :  PENDING — run this script to complete setup
-- ============================================================

GRANT SELECT ON paynest.users             TO paynest_ro;
GRANT SELECT ON paynest.payment_methods   TO paynest_ro;
GRANT SELECT ON paynest.external_services TO paynest_ro;
GRANT SELECT ON paynest.oauth_connections TO paynest_ro;
GRANT SELECT ON paynest.notifications     TO paynest_ro;
GRANT SELECT ON paynest.payment_history   TO paynest_ro;
GRANT SELECT ON paynest.ai_insights       TO paynest_ro;

-- Read-only access to the API package (functions only)
GRANT EXECUTE ON paynest.paynest_api_pkg TO paynest_ro;

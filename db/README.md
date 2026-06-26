# PayNest — Oracle 23ai Database

## Runbook

All scripts target the `FREEPDB1` pluggable database on Oracle 23ai Free.  
Connection string: `localhost/FREEPDB1`

| # | Script | Connect As | What It Does |
|---|--------|-----------|-------------- |
| 1 | `01_tablespaces.sql` | `SYS AS SYSDBA` | Create `PAYNEST_DATA` and `PAYNEST_IDX` tablespaces |
| 2 | `02_users_grants.sql` | `SYS AS SYSDBA` | Create 4 application users with base role grants |
| 3 | `03_schema.sql` | `SYS AS SYSDBA` | Create 7 tables with constraints + 8 indexes |
| 4 | `04_app_grants.sql` | `PAYNEST` | Grant DML privileges to `PAYNEST_APP` |
| 5 | `05_ro_grants.sql` | `PAYNEST` | Grant SELECT privileges to `PAYNEST_RO` |
| 6 | `06_plsql_package.sql` | `PAYNEST` | Create `PAYNEST_API_PKG` (5 procedures/functions) |

> **Status:** Steps 1–4 were executed via Oracle MCP on 2026-06-25 and are already applied.  
> Run **05_ro_grants.sql** and **06_plsql_package.sql** to complete the setup.

## Users

| Username | Password | Purpose |
|----------|----------|---------|
| `PAYNEST` | `paynest2026` | Schema owner — all DDL and DML |
| `PAYNEST_APP` | `paynest2026` | API runtime — DML on all tables |
| `PAYNEST_RO` | `paynest2026` | Analytics — SELECT only |
| `PAYNEST_ADMIN` | `paynest2026` | DBA maintenance — full DBA role |

## Entity Relationships

```
users
  payment_methods     (FK user_id → users.id  ON DELETE CASCADE)
  oauth_connections   (FK user_id → users.id  ON DELETE CASCADE)
  external_services   (FK user_id → users.id  ON DELETE CASCADE)
                      (FK payment_method_id   ON DELETE SET NULL)
                      (FK oauth_connection_id ON DELETE SET NULL)
  notifications       (FK user_id             ON DELETE CASCADE)
                      (FK service_id          ON DELETE SET NULL)
  payment_history     (FK user_id             ON DELETE CASCADE)
                      (FK service_id          ON DELETE CASCADE)
  ai_insights         (FK user_id             ON DELETE CASCADE)
```

## Tablespaces

| Tablespace | Initial | Max | Purpose |
|------------|---------|-----|--------|
| `PAYNEST_DATA` | 100 MB | 2 GB | Tables and LOBs |
| `PAYNEST_IDX` | 50 MB | 1 GB | Indexes and unique constraints |

## Backend Connection Pools

The Node.js backend (`backend/`) uses two Oracle connection pools:
- **`PAYNEST_APP`** — all API write and read operations
- **`PAYNEST_RO`** — analytics endpoints (`GET /api/analytics/*`)

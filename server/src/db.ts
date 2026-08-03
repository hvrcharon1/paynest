import oracledb from 'oracledb'
import fs from 'fs'
import os from 'os'
import path from 'path'

let pool: oracledb.Pool | null = null

// --- Wallet bootstrap for ADB mTLS (thin-mode) ---
// When ORACLE_WALLET_CONTENT is set it is a base64-encoded wallet zip.
// We extract it once to a temp directory so oracledb thin mode can read it.
let walletDir: string | null = null

function prepareWallet(): string | null {
  const b64 = process.env.ORACLE_WALLET_CONTENT
  if (!b64) return null

  if (walletDir) return walletDir  // already extracted this process lifetime

  const dir = path.join(os.tmpdir(), `paynest-wallet-${process.pid}`)
  fs.mkdirSync(dir, { recursive: true })

  const buf = Buffer.from(b64, 'base64')
  const zipPath = path.join(dir, 'wallet.zip')
  fs.writeFileSync(zipPath, buf)

  // Use Node.js built-in zlib + unzip via the adm-zip workaround:
  // Since we cannot install extra packages mid-flight, use the unzip approach
  // that oracledb thin mode accepts: point walletLocation at the zip file itself.
  // oracledb ≥ 6.4 thin mode accepts a .zip directly for walletLocation.
  walletDir = zipPath
  return walletDir
}

export async function initPool(): Promise<void> {
  if (pool) return  // idempotent — safe to call multiple times in serverless

  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
  oracledb.autoCommit = false

  const user          = process.env.ORACLE_USER          || 'PAYNEST_APP'
  const password      = process.env.ORACLE_PASSWORD       || 'paynest2026'
  const connectString = process.env.ORACLE_CONNECT_STRING || 'localhost:1521/FREEPDB1'

  // Serverless-friendly pool sizing: keep min=0 so idle functions hold no
  // persistent DB connections.  Max=5 fits within ADB default connection limits.
  const isServerless = process.env.VERCEL === '1'
  const poolAttrs: oracledb.PoolAttributes = {
    user,
    password,
    connectString,
    poolMin:       isServerless ? 0 : 2,
    poolMax:       isServerless ? 5 : 10,
    poolIncrement: 1,
    poolPingInterval: 60,
    poolTimeout:   300,
  }

  // Wallet (mTLS) — present when ORACLE_WALLET_CONTENT is set
  const walletPath = prepareWallet()
  if (walletPath) {
    poolAttrs.walletLocation = walletPath
    if (process.env.ORACLE_WALLET_PASSWORD) {
      poolAttrs.walletPassword = process.env.ORACLE_WALLET_PASSWORD
    }
  }

  pool = await oracledb.createPool(poolAttrs)
  console.log('[DB] Oracle connection pool initialized')
}

export async function getConnection(): Promise<oracledb.Connection> {
  if (!pool) throw new Error('Database pool not initialized')
  const conn = await pool.getConnection()
  await conn.execute('ALTER SESSION SET CURRENT_SCHEMA = PAYNEST')
  return conn
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(10)
    pool = null
  }
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: oracledb.BindParameters = {},
): Promise<T[]> {
  const conn = await getConnection()
  try {
    const result = await conn.execute<T>(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    return (result.rows ?? []) as T[]
  } finally {
    await conn.close()
  }
}

export async function execute(
  sql: string,
  params: oracledb.BindParameters = {},
  options: { autoCommit?: boolean } = {},
): Promise<oracledb.Result<unknown>> {
  const conn = await getConnection()
  try {
    const result = await conn.execute(sql, params, { autoCommit: options.autoCommit ?? true })
    return result
  } finally {
    await conn.close()
  }
}

export async function callProcedure(
  sql: string,
  params: oracledb.BindParameters = {},
): Promise<oracledb.Result<unknown>> {
  const conn = await getConnection()
  try {
    const result = await conn.execute(sql, params, { autoCommit: true })
    return result
  } finally {
    await conn.close()
  }
}

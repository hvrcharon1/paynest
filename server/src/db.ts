import oracledb from 'oracledb'
import fs from 'fs'
import os from 'os'
import path from 'path'
import AdmZip from 'adm-zip'

let pool: oracledb.Pool | null = null
let walletDir: string | null = null

// Decode ORACLE_WALLET_CONTENT (base64 zip), extract to a temp directory,
// and return that directory path. oracledb thin mode needs the extracted
// directory (containing tnsnames.ora + cwallet.sso) for walletLocation,
// NOT the zip file path itself.
function prepareWallet(): string | null {
  const b64 = process.env.ORACLE_WALLET_CONTENT
  if (!b64) return null

  if (walletDir) return walletDir  // already extracted this process lifetime

  const tmpBase = path.join(os.tmpdir(), `paynest-wallet-${process.pid}`)
  const zipPath  = path.join(tmpBase, 'wallet.zip')
  const extractTo = path.join(tmpBase, 'extracted')

  fs.mkdirSync(tmpBase,    { recursive: true })
  fs.mkdirSync(extractTo,  { recursive: true })

  const zipBuf = Buffer.from(b64, 'base64')
  fs.writeFileSync(zipPath, zipBuf)

  // Pure-JS extraction — no system unzip binary required
  const zip = new AdmZip(zipBuf)
  zip.extractAllTo(extractTo, true)

  walletDir = extractTo
  console.log('[DB] Wallet extracted to', extractTo)
  console.log('[DB] Wallet contents:', fs.readdirSync(extractTo).join(', '))
  return walletDir
}

export async function initPool(): Promise<void> {
  if (pool) return  // idempotent — safe to call multiple times on warm instances

  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
  oracledb.autoCommit = false

  const user          = process.env.ORACLE_USER          || 'PAYNEST_APP'
  const password      = process.env.ORACLE_PASSWORD       || 'paynest2026'
  const connectString = process.env.ORACLE_CONNECT_STRING || 'localhost:1521/FREEPDB1'

  const isServerless = process.env.VERCEL === '1'
  const poolAttrs: oracledb.PoolAttributes = {
    user,
    password,
    connectString,
    poolMin:          isServerless ? 0 : 2,
    poolMax:          isServerless ? 5 : 10,
    poolIncrement:    1,
    poolPingInterval: 60,
    poolTimeout:      300,
  }

  const walletPath = prepareWallet()
  if (walletPath) {
    // walletLocation tells oracledb where cwallet.sso / ewallet.p12 lives.
    // TNS_ADMIN tells oracledb where tnsnames.ora lives (same directory).
    // Both must point at the extracted wallet directory.
    poolAttrs.walletLocation = walletPath
    process.env.TNS_ADMIN = walletPath
    if (process.env.ORACLE_WALLET_PASSWORD) {
      poolAttrs.walletPassword = process.env.ORACLE_WALLET_PASSWORD
    }
    console.log('[DB] Using wallet at', walletPath)
    console.log('[DB] TNS_ADMIN set to', walletPath)
  }

  console.log('[DB] Connecting as', user, 'to', connectString)
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

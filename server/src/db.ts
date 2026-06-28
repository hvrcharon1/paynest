import oracledb from 'oracledb'

let pool: oracledb.Pool | null = null

export async function initPool(): Promise<void> {
  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER || 'PAYNEST_APP',
    password: process.env.ORACLE_PASSWORD || 'paynest2026',
    connectString: process.env.ORACLE_CONNECT_STRING || 'localhost:1521/FREEPDB1',
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
  })
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
  oracledb.autoCommit = false
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

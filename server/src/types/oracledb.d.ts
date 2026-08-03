declare module 'oracledb' {
  interface PoolAttributes {
    user?: string
    password?: string
    connectString?: string
    poolMin?: number
    poolMax?: number
    poolIncrement?: number
    poolPingInterval?: number
    poolTimeout?: number
    // ADB mTLS (thin mode wallet support)
    walletLocation?: string
    walletPassword?: string
  }

  interface Pool {
    getConnection(): Promise<Connection>
    close(drainTime?: number): Promise<void>
  }

  interface ExecuteOptions {
    outFormat?: number
    autoCommit?: boolean
  }

  interface Result<T> {
    rows?: T[]
    rowsAffected?: number
    outBinds?: Record<string, unknown>
  }

  type BindParameters = Record<string, unknown> | unknown[]

  interface Connection {
    execute<T = Record<string, unknown>>(
      sql: string,
      params?: BindParameters,
      options?: ExecuteOptions,
    ): Promise<Result<T>>
    commit(): Promise<void>
    close(): Promise<void>
  }

  const OUT_FORMAT_OBJECT: number
  const CLOB: number
  let outFormat: number
  let autoCommit: boolean
  let fetchAsString: number[]

  function createPool(attrs: PoolAttributes): Promise<Pool>
  function getPool(): Pool
}

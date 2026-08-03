import type { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const message = err?.message || 'Internal server error'
  const status  = (err as { status?: number }).status ?? 500
  console.error('[API Error]', message, err?.stack?.split('\n')[1]?.trim() ?? '')
  // Use a replacer to avoid circular-reference crashes when oracledb
  // attaches connection internals to the error object
  const seen = new WeakSet()
  res.status(status).json(
    JSON.parse(JSON.stringify({ error: message }, (_k, v) => {
      if (typeof v === 'object' && v !== null) {
        if (seen.has(v)) return '[Circular]'
        seen.add(v)
      }
      return v
    }))
  )
}

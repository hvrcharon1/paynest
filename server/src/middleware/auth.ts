import type { Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string | undefined
  if (!userId) {
    res.status(401).json({ error: 'Missing x-user-id header' })
    return
  }
  req.userId = userId
  next()
}

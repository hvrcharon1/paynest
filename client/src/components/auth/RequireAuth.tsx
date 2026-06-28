import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * Wrap protected routes with this via a layout route in App.tsx:
 *
 *   <Route element={<RequireAuth />}>
 *     <Route path="/" element={<Dashboard />} />
 *     ...
 *   </Route>
 *
 * Unauthenticated visitors are bounced to /login, and Login remembers
 * where they came from so it can send them back after signing in.
 */
export function RequireAuth() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

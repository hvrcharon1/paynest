import { Routes, Route } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import PaymentMethods from '@/pages/PaymentMethods'
import Services from '@/pages/Services'
import CalendarPage from '@/pages/Calendar'
import Analytics from '@/pages/Analytics'
import AIAssistant from '@/pages/AIAssistant'
import Settings from '@/pages/Settings'
import OAuthCallback from '@/pages/OAuthCallback'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import { RequireAuth } from '@/components/auth/RequireAuth'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* Everything below requires a signed-in user */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/payment-methods" element={<PaymentMethods />} />
        <Route path="/services" element={<Services />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/assistant" element={<AIAssistant />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

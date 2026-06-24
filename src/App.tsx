import { Routes, Route } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import PaymentMethods from '@/pages/PaymentMethods'
import Services from '@/pages/Services'
import CalendarPage from '@/pages/Calendar'
import Analytics from '@/pages/Analytics'
import AIAssistant from '@/pages/AIAssistant'
import Settings from '@/pages/Settings'
import OAuthCallback from '@/pages/OAuthCallback'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/payment-methods" element={<PaymentMethods />} />
      <Route path="/services" element={<Services />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/assistant" element={<AIAssistant />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
    </Routes>
  )
}

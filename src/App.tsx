import { ToastProvider } from './components/v2/Toast'
import { FinancialCoachPage } from './screens/FinancialCoachPage'

export default function App() {
  return (
    <ToastProvider>
      <FinancialCoachPage />
    </ToastProvider>
  )
}

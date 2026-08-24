import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import ForecastPage from './pages/ForecastPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

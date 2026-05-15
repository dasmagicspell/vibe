import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { NavBar }       from '@/components/shared/NavBar'
import { HomeView }     from '@/views/HomeView'
import { CalibrateView } from '@/views/CalibrateView'
import { IntakeView }   from '@/views/IntakeView'
import { ScheduleView } from '@/views/ScheduleView'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <div className="flex-1">
            <Routes>
              <Route path="/"          element={<HomeView />} />
              <Route path="/calibrate" element={<CalibrateView />} />
              <Route path="/intake"    element={<IntakeView />} />
              <Route path="/schedule"  element={<ScheduleView />} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </HashRouter>
    </AppProvider>
  )
}

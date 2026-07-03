// Maps every URL to the page that should appear. This is the full app map.

import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from '../pages/Dashboard/Dashboard'
import Workers from '../pages/Workers/Workers'
import AddWorker from '../pages/Workers/AddWorker'
import WorkerDetail from '../pages/Workers/WorkerDetail'
import Sites from '../pages/Sites/Sites'
import AddSite from '../pages/Sites/AddSite'
import SiteDetail from '../pages/Sites/SiteDetail'
import WorkLog from '../pages/WorkLog/WorkLog'
import Calendar from '../pages/Calendar/Calendar'
import Payments from '../pages/Payments/Payments'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/workers" element={<Workers />} />
      <Route path="/workers/add" element={<AddWorker />} />
      <Route path="/workers/:workerId" element={<WorkerDetail />} />
      <Route path="/sites" element={<Sites />} />
      <Route path="/sites/add" element={<AddSite />} />
      <Route path="/sites/:siteId" element={<SiteDetail />} />
      <Route path="/worklog" element={<WorkLog />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

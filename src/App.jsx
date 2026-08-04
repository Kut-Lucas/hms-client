import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminInventory from './pages/admin/Inventory.jsx';
import AdminReports from './pages/admin/Reports.jsx';
import AdminAudit from './pages/admin/Audit.jsx';
import AdminPatients from './pages/admin/Patients.jsx';
import ReceptionistDashboard from './pages/receptionist/Dashboard.jsx';
import TriageDashboard from './pages/triage/Dashboard.jsx';
import DoctorDashboard from './pages/doctor/Dashboard.jsx';
import LabDashboard from './pages/lab_technician/Dashboard.jsx';
import PharmacyDashboard from './pages/pharmacist/Dashboard.jsx';

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="patients" element={<AdminPatients />} />
                <Route path="audit" element={<AdminAudit />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['receptionist', 'admin']} />}>
              <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roles={['triage', 'admin']} />}>
              <Route path="/triage/dashboard" element={<TriageDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roles={['doctor', 'admin']} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roles={['lab_technician', 'admin']} />}>
              <Route path="/lab_technician/dashboard" element={<LabDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roles={['pharmacist', 'admin']} />}>
              <Route path="/pharmacist/dashboard" element={<PharmacyDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PatientPortal from './pages/PatientPortal';
import PrivateRoute from './components/PrivateRoute';
import UserManagement from './pages/UserManagement';
import AppointmentsManagement from './pages/AppointmentsManagement';
import PatientsManagement from './pages/PatientsManagement';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRoles={['DENTIST', 'RECEPTIONIST']}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
		<Route
			path="/admin/users"
			element={
				<PrivateRoute allowedRoles={['ADMIN']}>
				<UserManagement />
			</PrivateRoute>
		}
		/>
        <Route
          path="/admin/appointments"
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
              <AppointmentsManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/patients"
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
              <PatientsManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/portal/dashboard"
          element={
            <PrivateRoute allowedRoles={['PATIENT']}>
              <PatientPortal />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

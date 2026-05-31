import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PublicClinicPage from './pages/PublicClinicPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import PatientPortal from './pages/PatientPortal';
import PatientAppointments from './pages/PatientAppointments';
import PatientMyRecords from './pages/PatientMyRecords';
import PatientBilling from './pages/PatientBilling';
import PatientProfile from './pages/PatientProfile';
import PrivateRoute from './components/PrivateRoute';
import UserManagement from './pages/UserManagement';
import AppointmentsManagement from './pages/AppointmentsManagement';
import PatientsManagement from './pages/PatientsManagement';
import InventoryManagement from './pages/InventoryManagement';
import BillingInvoices from './pages/BillingInvoices';
import DentistsManagement from './pages/DentistsManagement';
import DentalRecordsManagement from './pages/DentalRecordsManagement';
import TreatmentsManagement from './pages/TreatmentsManagement';
import RemindersPage from './pages/RemindersPage';
import SystemSettings from './pages/SystemSettings';
import DentistAppointments from './pages/DentistAppointments';
import PatientsView from './pages/PatientsView';
import DentistDentalRecords from './pages/DentistDentalRecords';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicClinicPage />} />
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
          path="/dentist/dashboard"
          element={
            <PrivateRoute allowedRoles={['DENTIST']}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dentist/appointments"
          element={
            <PrivateRoute allowedRoles={['DENTIST']}>
              <DentistAppointments />
            </PrivateRoute>
          }
        />
        <Route
          path="/dentist/patients"
          element={
            <PrivateRoute allowedRoles={['DENTIST']}>
              <PatientsView />
            </PrivateRoute>
          }
        />
        <Route
          path="/dentist/dental-records"
          element={
            <PrivateRoute allowedRoles={['DENTIST']}>
              <DentistDentalRecords />
            </PrivateRoute>
          }
        />
        <Route
          path="/dentist/treatments"
          element={
            <PrivateRoute allowedRoles={['DENTIST']}>
              <TreatmentsManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/dentist/reminders"
          element={
            <PrivateRoute allowedRoles={['DENTIST']}>
              <RemindersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/receptionist/dashboard"
          element={
            <PrivateRoute allowedRoles={['RECEPTIONIST']}>
              <ReceptionistDashboard />
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
          path="/admin/inventory"
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
              <InventoryManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/billing"
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
              <BillingInvoices />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/dentists"
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
              <DentistsManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/dental-records"
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DENTIST']}>
              <DentalRecordsManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/reminders"
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
              <RemindersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <SystemSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/treatments"
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DENTIST']}>
              <TreatmentsManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/dashboard"
          element={
            <PrivateRoute allowedRoles={['PATIENT']}>
              <PatientPortal />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <PrivateRoute allowedRoles={['PATIENT']}>
              <PatientAppointments />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/records"
          element={
            <PrivateRoute allowedRoles={['PATIENT']}>
              <PatientMyRecords />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/billing"
          element={
            <PrivateRoute allowedRoles={['PATIENT']}>
              <PatientBilling />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <PrivateRoute allowedRoles={['PATIENT']}>
              <PatientProfile />
            </PrivateRoute>
          }
        />
        <Route path="/portal/dashboard" element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// License: Proprietary / Internal Use
// HealthVault (HV4) - All rights reserved.
// Designed and developed by the HealthVault Team.
// Unauthorized copying, distribution, or modification is strictly prohibited.
//
// Contributors:
//   - Mehul Ranawat       (Lead Developer & Architect)
//   - Laxmi Nayakodi      (UI/UX Design)
//   - Srushti Reddy       (Security)
//   - Sanket Deshmukh     (Data Engineering)

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ScrollToTop from './components/ScrollToTop'

import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import PatientDashboard from './pages/patient/PatientDashboard'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DashboardLayout from './components/DashboardLayout'
import HealthRecords from './pages/patient/HealthRecords'
import DoctorProfile from './pages/doctor/DoctorProfile'
import PatientProfile from './pages/patient/PatientProfile'
import DoctorPatients from './pages/doctor/DoctorPatients'
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions'
import PatientAppointments from './pages/patient/PatientAppointments'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSettings from './pages/admin/AdminSettings'
import MedInsight from './pages/shared/MedInsight'
import PatientMedications from './pages/patient/PatientMedications'
import MyProfile from './pages/shared/MyProfile'
import EmergencyCard from './pages/public/EmergencyCard'
import QRScanner from './pages/public/QRScanner'
import EpiTrack from './pages/public/EpiTrack'
import PrivacyPolicy from './pages/public/PrivacyPolicy'
import ContactPage from './pages/public/ContactPage'
import SoftAurora from './components/Backgrounds/SoftAurora'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isVerified, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!isVerified) return <Navigate to="/verify-otp" replace />
  return <>{children}</>
}

function DashboardRedirect() {
  const { role, loading } = useAuth()
  if (loading) return null
  if (role === 'admin') return <Navigate to="/admin-dashboard" replace />
  if (role === 'doctor') return <Navigate to="/doctor-dashboard" replace />
  return <Navigate to="/patient-dashboard" replace />
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Landing page — always accessible */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/medinsight" element={<MedInsight />} />
      <Route path="/qr-scanner" element={<QRScanner />} />
      <Route path="/emergency-card/:uid" element={<EmergencyCard />} />
      <Route path="/epitrack" element={<EpiTrack />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Auth pages — only for unauthenticated users */}
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

      {/* Verification page */}
      <Route path="/verify-otp" element={<VerifyOtpPage />} />

      {/* Dashboard redirect — role-based */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

      {/* Patient Dashboard */}
      <Route path="/patient-dashboard" element={
        <ProtectedRoute>
          <DashboardLayout><PatientDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Patient Appointments */}
      <Route path="/patient-dashboard/appointments" element={
        <ProtectedRoute>
          <DashboardLayout><PatientAppointments /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Patient Health Records */}
      <Route path="/patient-dashboard/records" element={
        <ProtectedRoute>
          <DashboardLayout><HealthRecords /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Patient Viewing Doctor Profile */}
      <Route path="/patient-dashboard/doctor-profile/:id" element={
        <ProtectedRoute>
          <DashboardLayout><DoctorProfile /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Doctor Dashboard */}
      <Route path="/doctor-dashboard" element={
        <ProtectedRoute>
          <DashboardLayout><DoctorDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Doctor Patients List */}
      <Route path="/doctor-dashboard/patients" element={
        <ProtectedRoute>
          <DashboardLayout><DoctorPatients /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Doctor Appointments */}
      <Route path="/doctor-dashboard/appointments" element={
        <ProtectedRoute>
          <DashboardLayout><DoctorAppointments /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Doctor Prescriptions */}
      <Route path="/doctor-dashboard/prescriptions" element={
        <ProtectedRoute>
          <DashboardLayout><DoctorPrescriptions /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Doctor Viewing Patient Profile */}
      <Route path="/doctor-dashboard/patient-profile/:id" element={
        <ProtectedRoute>
          <DashboardLayout><PatientProfile /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Admin Dashboard */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute>
          <DashboardLayout><AdminDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Admin Settings */}
      <Route path="/admin-dashboard/settings" element={
        <ProtectedRoute>
          <DashboardLayout><AdminSettings /></DashboardLayout>
        </ProtectedRoute>
      } />



      {/* Patient Medications */}
      <Route path="/patient-dashboard/medications" element={
        <ProtectedRoute>
          <DashboardLayout><PatientMedications /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Patient Profile (My Profile) */}
      <Route path="/patient-dashboard/profile" element={
        <ProtectedRoute>
          <DashboardLayout><MyProfile /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Doctor Profile (My Profile) */}
      <Route path="/doctor-dashboard/profile" element={
        <ProtectedRoute>
          <DashboardLayout><MyProfile /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <SoftAurora 
          speed={0.4} 
          scale={1.2} 
          brightness={1.2} 
          color1="#0891b2" 
          color2="#06b6d4" 
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

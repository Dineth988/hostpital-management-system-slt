import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import TodayPage from './pages/TodayPage.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import DoctorsPage from './pages/DoctorsPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AppShell from './components/AppShell.jsx';

function AppRoutes() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;
  if (user.forcePasswordChange) return <ChangePasswordPage />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/patients" element={<RequirePermission roles={['RECEPTIONIST','DOCTOR','ADMIN','CASHIER']}><PatientsPage /></RequirePermission>} />
        <Route path="/doctors"  element={<RequirePermission roles={['RECEPTIONIST','DOCTOR','ADMIN','CASHIER']}><DoctorsPage /></RequirePermission>} />
        <Route path="/billing"  element={<RequirePermission roles={['CASHIER','ADMIN']}><BillingPage /></RequirePermission>} />
        <Route path="/admin"    element={<RequirePermission roles={['ADMIN']}><AdminPage /></RequirePermission>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

function RequirePermission({ children, roles }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', padding: '40px' }}>
        <div style={{ fontSize: '48px' }}>ðŸš«</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>403 â€” Access Denied</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '320px' }}>
          Your role (<strong style={{ color: 'var(--accent)' }}>{user?.role}</strong>) does not have permission to view this section.
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  );
}


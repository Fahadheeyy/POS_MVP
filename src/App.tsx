import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import { Role } from './types';
import { AuthPage } from './features/auth/AuthPage';
import { POSPage } from './features/pos/POSPage';
import { TodayOrdersPage } from './features/orders/TodayOrdersPage';
import { KDSPage } from './features/kds/KDSPage';
import { ManagerConsolePage } from './features/manager/ManagerConsolePage';
import { OwnerDashboardPage } from './features/owner/OwnerDashboardPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SetupWizardPage } from './features/setup/SetupWizardPage';
import { UIKitPage } from './features/uikit/UIKitPage';
import { AdminPortalPage } from './features/admin/AdminPortalPage';
import { AccessDenied } from './components/AccessDenied';

// Initial Route Redirector
const RootRedirect: React.FC = () => {
  const { settings, currentUser } = useAppStore();
  if (!settings.isSetupCompleted) {
    return <Navigate to="/setup" replace />;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to="/pos" replace />;
};

// Protected Route Wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: Role[];
}> = ({ children, allowedRoles }) => {
  const { currentUser, currentRole } = useAppStore();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Admin role has master developer clearance across all routes
  if (currentRole !== 'admin' && !allowedRoles.includes(currentRole)) {
    return <AccessDenied requiredRole={allowedRoles[0]} />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/setup" element={<SetupWizardPage />} />
        <Route path="/login" element={<AuthPage />} />

        {/* Cashier Routes */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={['cashier', 'manager', 'owner']}>
              <POSPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={['cashier', 'manager', 'owner']}>
              <TodayOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/shift" element={<Navigate to="/pos" replace />} />

        {/* Kitchen Routes */}
        <Route
          path="/kds"
          element={
            <ProtectedRoute allowedRoles={['kitchen', 'manager', 'owner']}>
              <KDSPage />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager', 'owner']}>
              <ManagerConsolePage />
            </ProtectedRoute>
          }
        />

        {/* Owner Routes */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <OwnerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/reports"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin & Operations Hub (Developer & Sales Portal) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'owner']}>
              <AdminPortalPage />
            </ProtectedRoute>
          }
        />

        {/* UI Kit Showcase */}
        <Route path="/ui-kit" element={<UIKitPage />} />

        {/* Catch all fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;


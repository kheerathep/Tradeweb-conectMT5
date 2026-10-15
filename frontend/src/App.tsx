import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TradesPage } from './pages/TradesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { Mt5ConnectionsPage } from './pages/Mt5ConnectionsPage';
import { AccountsPage } from './pages/AccountsPage';
import { Mt5GuidePage } from './pages/Mt5GuidePage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Application Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="trades" element={<TradesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="mt5-connections" element={<Mt5ConnectionsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="mt5-guide" element={<Mt5GuidePage />} />
          <Route path="settings" element={<Navigate to="/mt5-connections" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;

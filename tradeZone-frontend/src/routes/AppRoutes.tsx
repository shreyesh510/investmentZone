import React from 'react';
import { Navigate } from 'react-router-dom';
import Login from '../pages/login';
import Zone from '../pages/zone';
import Settings from '../pages/settings';
import InvestmentDashboard from '../pages/investment/dashboard';
import Withdraw from '../pages/investment/withdraw';
import Deposit from '../pages/investment/deposit';
import WalletsPage from '../pages/investment/wallets';
import TradePnL from '../pages/investment/tradePnl';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../layouts/AppLayout';

interface AppRoutesConfig {
  isAuthenticated: boolean;
}

export const createAppRoutes = ({ isAuthenticated }: AppRoutesConfig) => [
  {
    path: '/login',
    element: isAuthenticated ? <Navigate to="/zone" replace /> : <Login />
  },
  {
    path: '/zone',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Zone />
        </AppLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Settings />
        </AppLayout>
      </ProtectedRoute>
    )
  },
  // Investment Routes
  {
    path: '/investment/dashboard',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <InvestmentDashboard />
        </AppLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/investment/withdraw',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Withdraw />
        </AppLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/investment/deposit',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Deposit />
        </AppLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/investment/wallets',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <WalletsPage />
        </AppLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/investment/tradePnl',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <TradePnL />
        </AppLayout>
      </ProtectedRoute>
    )
  },
  // Root redirect
  {
    path: '/',
    element: isAuthenticated ? <Navigate to="/zone" replace /> : <Navigate to="/login" replace />
  },
  // Fallback for unknown routes
  {
    path: '*',
    element: isAuthenticated ? <Navigate to="/zone" replace /> : <Navigate to="/login" replace />
  }
];
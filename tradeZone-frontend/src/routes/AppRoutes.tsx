import React from 'react';
import { Navigate } from 'react-router-dom';
import Login from '../pages/login';
import Zone from '../pages/zone';
import Settings from '../pages/settings';
import LiveChart from '../components/chart/liveChart';
import Positions from '../pages/investment/positions';
import InvestmentDashboard from '../pages/investment/dashboard';
import Withdraw from '../pages/investment/withdraw';
import Deposit from '../pages/investment/deposit';
import WalletsPage from '../pages/investment/wallets';
import TradePnL from '../pages/investment/tradePnl';
import ProtectedRoute from './ProtectedRoute';

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
        <Zone />
      </ProtectedRoute>
    )
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    )
  },
  {
    path: '/chart',
    element: (
      <ProtectedRoute>
        <LiveChart />
      </ProtectedRoute>
    )
  },
  // Investment Routes
  {
    path: '/investment/positions',
    element: (
      <ProtectedRoute>
        <Positions />
      </ProtectedRoute>
    )
  },
  {
    path: '/investment/dashboard',
    element: (
      <ProtectedRoute>
        <InvestmentDashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/investment/withdraw',
    element: (
      <ProtectedRoute>
        <Withdraw />
      </ProtectedRoute>
    )
  },
  {
    path: '/investment/deposit',
    element: (
      <ProtectedRoute>
        <Deposit />
      </ProtectedRoute>
    )
  },
  {
    path: '/investment/wallets',
    element: (
      <ProtectedRoute>
        <WalletsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/investment/tradePnl',
    element: (
      <ProtectedRoute>
        <TradePnL />
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
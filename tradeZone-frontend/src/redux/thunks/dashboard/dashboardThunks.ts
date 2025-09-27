import { createAsyncThunk } from '@reduxjs/toolkit';

export interface UnifiedDashboardData {
  totalDeposits: number;
  totalWithdrawals: number;
  totalTrades: number;
  totalProfit: number;
  totalLoss: number;
}

export const fetchUnifiedDashboard = createAsyncThunk(
  'dashboard/fetchUnified',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔧 Dashboard thunk starting...');
      const token = localStorage.getItem('authToken');
      console.log('🔧 Auth token exists:', !!token);

      if (!token) {
        console.log('❌ No auth token found');
        throw new Error('No authentication token found');
      }

      console.log('🔧 Making API request to dashboard/summary...');
      const response = await fetch('http://localhost:3000/dashboard/summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔧 Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UnifiedDashboardData = await response.json();
      console.log('✅ Dashboard data received:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching unified dashboard:', error);
      return rejectWithValue(error.message || 'Failed to fetch dashboard data');
    }
  }
);
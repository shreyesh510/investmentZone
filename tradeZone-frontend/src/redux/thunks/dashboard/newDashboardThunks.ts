import { createAsyncThunk } from '@reduxjs/toolkit';
import { newDashboardApi } from '../../../services/dashboardApiNew';

// Fetch all dashboard data in parallel (optimized - fetches all timeframes at once)
export const fetchAllDashboardData = createAsyncThunk(
  'newDashboard/fetchAllDashboardData',
  async (timeframe: string = 'ALL', { rejectWithValue }) => {
    try {
      // Fetch all data with ALL timeframes at once to avoid repeated API calls
      const data = await newDashboardApi.getAllDashboardData('ALL');
      return { ...data, requestedTimeframe: timeframe };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
);

// Fetch positions data (optimized - fetches all timeframes at once)
export const fetchDashboardPositions = createAsyncThunk(
  'newDashboard/fetchDashboardPositions',
  async (timeframe: string = 'ALL', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getPositions('ALL');
      return { ...data, requestedTimeframe: timeframe };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch positions data');
    }
  }
);

// Fetch wallets data (optimized - fetches all timeframes at once)
export const fetchDashboardWallets = createAsyncThunk(
  'newDashboard/fetchDashboardWallets',
  async (timeframe: string = 'ALL', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getWallets('ALL');
      return { ...data, requestedTimeframe: timeframe };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallets data');
    }
  }
);

// Fetch trade P&L data (optimized - fetches all timeframes at once)
export const fetchDashboardTradePnL = createAsyncThunk(
  'newDashboard/fetchDashboardTradePnL',
  async (timeframe: string = 'ALL', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getTradePnL('ALL');
      return { ...data, requestedTimeframe: timeframe };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trade P&L data');
    }
  }
);

// Fetch transactions data (optimized - fetches all timeframes at once)
export const fetchDashboardTransactions = createAsyncThunk(
  'newDashboard/fetchDashboardTransactions',
  async (timeframe: string = 'ALL', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getTransactions('ALL');
      return { ...data, requestedTimeframe: timeframe };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions data');
    }
  }
);
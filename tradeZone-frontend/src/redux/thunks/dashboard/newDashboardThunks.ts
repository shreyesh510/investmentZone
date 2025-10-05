import { createAsyncThunk } from '@reduxjs/toolkit';
import { newDashboardApi } from '../../../services/dashboardApiNew';

// Fetch consolidated dashboard data (single API call)
export const fetchConsolidatedDashboard = createAsyncThunk(
  'newDashboard/fetchConsolidatedDashboard',
  async ({ timeframe = 'ALL', year }: { timeframe?: string, year?: number }, { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getConsolidatedDashboard(timeframe, year);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
);

// Fetch all dashboard data (now uses consolidated API)
export const fetchAllDashboardData = createAsyncThunk(
  'newDashboard/fetchAllDashboardData',
  async ({ timeframe = 'ALL', year }: { timeframe?: string, year?: number } = {}, { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getAllDashboardData(timeframe, year);
      return { ...data, requestedTimeframe: timeframe };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
);

// Legacy thunks for backward compatibility (now use consolidated API)
export const fetchDashboardPositions = createAsyncThunk(
  'newDashboard/fetchDashboardPositions',
  async (timeframe: string = 'ALL', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getPositions(timeframe);
      return { ...data, requestedTimeframe: timeframe };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch positions data');
    }
  }
);

export const fetchDashboardWallets = createAsyncThunk(
  'newDashboard/fetchDashboardWallets',
  async (timeframe: string = 'ALL', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getWallets(timeframe);
      return { ...data, requestedTimeframe: timeframe };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallets data');
    }
  }
);

export const fetchDashboardTradePnL = createAsyncThunk(
  'newDashboard/fetchDashboardTradePnL',
  async (timeframe: string = 'ALL', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getTradePnL(timeframe);
      return { ...data, requestedTimeframe: timeframe };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trade P&L data');
    }
  }
);

export const fetchDashboardTransactions = createAsyncThunk(
  'newDashboard/fetchDashboardTransactions',
  async (timeframe: string = 'ALL', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getTransactions(timeframe);
      return { ...data, requestedTimeframe: timeframe };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions data');
    }
  }
);

export const fetchTradePnLProgress = createAsyncThunk(
  'newDashboard/fetchTradePnLProgress',
  async (year?: number, { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getTradePnLProgress(year);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trade PnL progress data');
    }
  }
);
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DashboardSummary } from '../../services/dashboardApi';

interface DashboardState {
  data: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setDashboardData: (state, action: PayloadAction<DashboardSummary>) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDashboard: (state) => {
      state.data = null;
      state.error = null;
      state.lastUpdated = null;
    },
  },
});

export const {
  setLoading,
  setDashboardData,
  setError,
  clearError,
  clearDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
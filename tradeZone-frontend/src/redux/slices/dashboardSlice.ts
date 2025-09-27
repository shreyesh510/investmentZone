import { createSlice } from '@reduxjs/toolkit';
import { fetchUnifiedDashboard, type UnifiedDashboardData } from '../thunks/dashboard/dashboardThunks';

interface DashboardState {
  data: UnifiedDashboardData | null;
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
    clearError: (state) => {
      state.error = null;
    },
    clearData: (state) => {
      state.data = null;
      state.error = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnifiedDashboard.pending, (state) => {
        console.log('🔄 Dashboard slice: fetchUnifiedDashboard.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnifiedDashboard.fulfilled, (state, action) => {
        console.log('✅ Dashboard slice: fetchUnifiedDashboard.fulfilled', action.payload);
        state.loading = false;
        state.data = action.payload;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchUnifiedDashboard.rejected, (state, action) => {
        console.log('❌ Dashboard slice: fetchUnifiedDashboard.rejected', action.payload);
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearData } = dashboardSlice.actions;
export default dashboardSlice.reducer;
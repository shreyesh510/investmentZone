import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TradePnLDto } from '../../services/tradePnLApi';
import { fetchTradePnL, createTradePnL, updateTradePnL, deleteTradePnL, fetchTradePnLStatistics } from '../thunks/tradePnL/tradePnLThunks';

interface TradePnLState {
  items: TradePnLDto[];
  statistics: any;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
}

const initialState: TradePnLState = {
  items: [],
  statistics: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
};

const tradePnLSlice = createSlice({
  name: 'tradePnL',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTradePnL.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTradePnL.fulfilled, (state, action: PayloadAction<TradePnLDto[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTradePnL.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch trade P&L records';
      })
      .addCase(createTradePnL.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTradePnL.fulfilled, (state, action: PayloadAction<TradePnLDto>) => {
        state.creating = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createTradePnL.rejected, (state, action) => {
        state.creating = false;
        state.error = (action.payload as string) ?? 'Failed to create trade P&L record';
      })
      .addCase(updateTradePnL.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateTradePnL.fulfilled, (state, action) => {
        state.updating = false;
        if (!action.payload.success) return;
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = { ...state.items[idx], ...(action.payload.patch as any) } as any;
        }
      })
      .addCase(updateTradePnL.rejected, (state, action) => {
        state.updating = false;
        state.error = (action.payload as string) ?? 'Failed to update trade P&L record';
      })
      .addCase(deleteTradePnL.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteTradePnL.fulfilled, (state, action) => {
        state.deleting = false;
        if (!action.payload.success) return;
        state.items = state.items.filter((item) => item.id !== action.payload.id);
      })
      .addCase(deleteTradePnL.rejected, (state, action) => {
        state.deleting = false;
        state.error = (action.payload as string) ?? 'Failed to delete trade P&L record';
      })
      .addCase(fetchTradePnLStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTradePnLStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchTradePnLStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch statistics';
      });
  },
});

export const { clearError } = tradePnLSlice.actions;

export default tradePnLSlice.reducer;
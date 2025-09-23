import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface PnlLimits {
  lossAmount: number;
  profitAmount: number;
}

interface PnlLimitsState {
  data: PnlLimits;
  loading: boolean;
  updating: boolean;
  error: string | null;
}

const initialState: PnlLimitsState = {
  data: {
    lossAmount: 5,
    profitAmount: 15,
  },
  loading: false,
  updating: false,
  error: null,
};

const pnlLimitsSlice = createSlice({
  name: 'pnlLimits',
  initialState,
  reducers: {
    fetchPnlLimitsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchPnlLimitsSuccess(state, action: PayloadAction<PnlLimits>) {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },
    fetchPnlLimitsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    updatePnlLimitsStart(state) {
      state.updating = true;
      state.error = null;
    },
    updatePnlLimitsSuccess(state, action: PayloadAction<PnlLimits>) {
      state.updating = false;
      state.data = action.payload;
      state.error = null;
    },
    updatePnlLimitsFailure(state, action: PayloadAction<string>) {
      state.updating = false;
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchPnlLimitsStart,
  fetchPnlLimitsSuccess,
  fetchPnlLimitsFailure,
  updatePnlLimitsStart,
  updatePnlLimitsSuccess,
  updatePnlLimitsFailure,
  clearError,
} = pnlLimitsSlice.actions;

export default pnlLimitsSlice.reducer;
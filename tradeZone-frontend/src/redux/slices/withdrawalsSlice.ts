import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchWithdrawals, createWithdrawal, updateWithdrawal, deleteWithdrawal } from '../thunks/withdrawals/withdrawalsThunks';
import type { WithdrawalDto } from '../../services/withdrawalsApi';

interface WithdrawalsState {
  items: WithdrawalDto[];
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: WithdrawalsState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
};

const withdrawalsSlice = createSlice({
  name: 'withdrawals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWithdrawals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawals.fulfilled, (state, action: PayloadAction<WithdrawalDto[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? 'Failed to fetch withdrawals';
      })
      .addCase(createWithdrawal.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createWithdrawal.fulfilled, (state, action: PayloadAction<WithdrawalDto>) => {
        state.creating = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createWithdrawal.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string ?? 'Failed to create withdrawal';
      })
      .addCase(updateWithdrawal.fulfilled, (state, action) => {
        if (!action.payload.success) return;
        const idx = state.items.findIndex((w) => w.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = { ...state.items[idx], ...(action.payload.patch as any) } as any;
        }
      })
      .addCase(deleteWithdrawal.fulfilled, (state, action) => {
        if (!action.payload.success) return;
        state.items = state.items.filter((w) => w.id !== action.payload.id);
      });
  },
});

export default withdrawalsSlice.reducer;

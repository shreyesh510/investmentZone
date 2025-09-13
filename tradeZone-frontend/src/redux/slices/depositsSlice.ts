import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DepositDto } from '../../services/depositsApi';
import { fetchDeposits, createDeposit, updateDeposit, deleteDeposit } from '../thunks/deposits/depositsThunks';

interface DepositsState {
  items: DepositDto[];
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: DepositsState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
};

const depositsSlice = createSlice({
  name: 'deposits',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeposits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeposits.fulfilled, (state, action: PayloadAction<DepositDto[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDeposits.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch deposits';
      })
      .addCase(createDeposit.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createDeposit.fulfilled, (state, action: PayloadAction<DepositDto>) => {
        state.creating = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createDeposit.rejected, (state, action) => {
        state.creating = false;
        state.error = (action.payload as string) ?? 'Failed to create deposit';
      })
      .addCase(updateDeposit.fulfilled, (state, action) => {
        if (!action.payload.success) return;
        const idx = state.items.findIndex((w) => w.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = { ...state.items[idx], ...(action.payload.patch as any) } as any;
        }
      })
      .addCase(deleteDeposit.fulfilled, (state, action) => {
        if (!action.payload.success) return;
        state.items = state.items.filter((w) => w.id !== action.payload.id);
      });
  },
});

export default depositsSlice.reducer;

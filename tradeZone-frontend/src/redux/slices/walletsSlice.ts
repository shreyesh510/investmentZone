import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WalletDto, WalletHistoryItem } from '../../services/walletsApi';
import { fetchWallets, createWallet, updateWallet, deleteWallet, fetchWalletHistory } from '../thunks/wallets/walletsThunks';

interface WalletsState {
  items: WalletDto[];
  loading: boolean;
  creating: boolean;
  error: string | null;
  history: WalletHistoryItem[];
  historyLoading: boolean;
}

const initialState: WalletsState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
  history: [],
  historyLoading: false,
};

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallets.fulfilled, (state, action: PayloadAction<WalletDto[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWallets.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch wallets';
      })
      .addCase(createWallet.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createWallet.fulfilled, (state, action: PayloadAction<WalletDto>) => {
        state.creating = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createWallet.rejected, (state, action) => {
        state.creating = false;
        state.error = (action.payload as string) ?? 'Failed to create wallet';
      })
      .addCase(updateWallet.fulfilled, (state, action) => {
        if (!action.payload.success) return;
        const idx = state.items.findIndex((w) => w.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = { ...state.items[idx], ...(action.payload.patch as any) } as any;
        }
      })
      .addCase(deleteWallet.fulfilled, (state, action) => {
        if (!action.payload.success) return;
        state.items = state.items.filter((w) => w.id !== action.payload.id);
      })
      .addCase(fetchWalletHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchWalletHistory.fulfilled, (state, action: PayloadAction<WalletHistoryItem[]>) => {
        state.historyLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchWalletHistory.rejected, (state) => {
        state.historyLoading = false;
      });
  },
});

export default walletsSlice.reducer;

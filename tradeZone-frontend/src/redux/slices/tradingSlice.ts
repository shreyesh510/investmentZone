import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TradingPnL, TradingWallet, DailySummary, WalletBalance } from '../../types/trading';
import {
  fetchTradingPnL,
  createTradingPnL,
  updateTradingPnL,
  deleteTradingPnL,
  fetchDailySummary,
  fetchTradingPnLHistory,
  fetchTradingWallets,
  createTradingWallet,
  updateTradingWallet,
  deleteTradingWallet,
  fetchWalletBalance,
  fetchTradingWalletHistory,
} from '../thunks/trading/tradingThunks';

interface TradingState {
  pnlList: TradingPnL[];
  wallets: TradingWallet[];
  dailySummary: DailySummary | null;
  walletBalance: WalletBalance | null;
  pnlHistory: any[];
  walletHistory: any[];
  loading: boolean;
  error: string | null;
}

const initialState: TradingState = {
  pnlList: [],
  wallets: [],
  dailySummary: null,
  walletBalance: null,
  pnlHistory: [],
  walletHistory: [],
  loading: false,
  error: null,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Trading P&L
    builder
      .addCase(fetchTradingPnL.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTradingPnL.fulfilled, (state, action: PayloadAction<TradingPnL[]>) => {
        state.loading = false;
        state.pnlList = action.payload;
      })
      .addCase(fetchTradingPnL.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Trading P&L
    builder
      .addCase(createTradingPnL.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTradingPnL.fulfilled, (state, action: PayloadAction<TradingPnL>) => {
        state.loading = false;
        state.pnlList.unshift(action.payload);
      })
      .addCase(createTradingPnL.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Trading P&L
    builder
      .addCase(updateTradingPnL.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTradingPnL.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        state.loading = false;
      })
      .addCase(updateTradingPnL.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Trading P&L
    builder
      .addCase(deleteTradingPnL.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTradingPnL.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.pnlList = state.pnlList.filter((pnl) => pnl.id !== action.payload);
      })
      .addCase(deleteTradingPnL.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Daily Summary
    builder
      .addCase(fetchDailySummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailySummary.fulfilled, (state, action: PayloadAction<DailySummary>) => {
        state.loading = false;
        state.dailySummary = action.payload;
      })
      .addCase(fetchDailySummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch P&L History
    builder
      .addCase(fetchTradingPnLHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTradingPnLHistory.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.pnlHistory = action.payload;
      })
      .addCase(fetchTradingPnLHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Trading Wallets
    builder
      .addCase(fetchTradingWallets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTradingWallets.fulfilled, (state, action: PayloadAction<TradingWallet[]>) => {
        state.loading = false;
        state.wallets = action.payload;
      })
      .addCase(fetchTradingWallets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Trading Wallet
    builder
      .addCase(createTradingWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTradingWallet.fulfilled, (state, action: PayloadAction<TradingWallet>) => {
        state.loading = false;
        state.wallets.unshift(action.payload);
      })
      .addCase(createTradingWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Trading Wallet
    builder
      .addCase(updateTradingWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTradingWallet.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        state.loading = false;
      })
      .addCase(updateTradingWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Trading Wallet
    builder
      .addCase(deleteTradingWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTradingWallet.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.wallets = state.wallets.filter((wallet) => wallet.id !== action.payload);
      })
      .addCase(deleteTradingWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Wallet Balance
    builder
      .addCase(fetchWalletBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletBalance.fulfilled, (state, action: PayloadAction<WalletBalance>) => {
        state.loading = false;
        state.walletBalance = action.payload;
      })
      .addCase(fetchWalletBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Wallet History
    builder
      .addCase(fetchTradingWalletHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTradingWalletHistory.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.walletHistory = action.payload;
      })
      .addCase(fetchTradingWalletHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = tradingSlice.actions;
export default tradingSlice.reducer;

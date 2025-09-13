import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  fetchAllDashboardData,
  fetchDashboardPositions,
  fetchDashboardWallets,
  fetchDashboardTradePnL,
  fetchDashboardTransactions,
} from '../thunks/dashboard/newDashboardThunks';
import type {
  DashboardPositionsResponse,
  DashboardWalletsResponse,
  DashboardTradePnLResponse,
  DashboardTransactionsResponse,
} from '../../services/dashboardApiNew';

interface NewDashboardState {
  positions: DashboardPositionsResponse | null;
  wallets: DashboardWalletsResponse | null;
  tradePnL: DashboardTradePnLResponse | null;
  transactions: DashboardTransactionsResponse | null;
  
  // Loading states for each section
  loading: {
    positions: boolean;
    wallets: boolean;
    tradePnL: boolean;
    transactions: boolean;
    all: boolean;
  };
  
  // Error states for each section
  errors: {
    positions: string | null;
    wallets: string | null;
    tradePnL: string | null;
    transactions: string | null;
    all: string | null;
  };
  
  // Current timeframe
  timeframe: string;
  lastUpdated: number | null;
}

const initialState: NewDashboardState = {
  positions: null,
  wallets: null,
  tradePnL: null,
  transactions: null,
  loading: {
    positions: false,
    wallets: false,
    tradePnL: false,
    transactions: false,
    all: false,
  },
  errors: {
    positions: null,
    wallets: null,
    tradePnL: null,
    transactions: null,
    all: null,
  },
  timeframe: '1M',
  lastUpdated: null,
};

const newDashboardSlice = createSlice({
  name: 'newDashboard',
  initialState,
  reducers: {
    setTimeframe: (state, action: PayloadAction<string>) => {
      state.timeframe = action.payload;
    },
    clearError: (state, action: PayloadAction<keyof typeof state.errors>) => {
      state.errors[action.payload] = null;
    },
    clearAllErrors: (state) => {
      state.errors = {
        positions: null,
        wallets: null,
        tradePnL: null,
        transactions: null,
        all: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all dashboard data
      .addCase(fetchAllDashboardData.pending, (state) => {
        state.loading.all = true;
        state.errors.all = null;
      })
      .addCase(fetchAllDashboardData.fulfilled, (state, action) => {
        state.loading.all = false;
        const { positions, wallets, tradePnL, transactions, errors } = action.payload;
        
        if (positions) state.positions = positions;
        if (wallets) state.wallets = wallets;
        if (tradePnL) state.tradePnL = tradePnL;
        if (transactions) state.transactions = transactions;
        
        // Set individual errors if any
        state.errors.positions = errors.positions?.message || null;
        state.errors.wallets = errors.wallets?.message || null;
        state.errors.tradePnL = errors.tradePnL?.message || null;
        state.errors.transactions = errors.transactions?.message || null;
        
        state.lastUpdated = Date.now();
      })
      .addCase(fetchAllDashboardData.rejected, (state, action) => {
        state.loading.all = false;
        state.errors.all = action.payload as string;
      })
      
      // Fetch positions
      .addCase(fetchDashboardPositions.pending, (state) => {
        state.loading.positions = true;
        state.errors.positions = null;
      })
      .addCase(fetchDashboardPositions.fulfilled, (state, action: PayloadAction<DashboardPositionsResponse>) => {
        state.loading.positions = false;
        state.positions = action.payload;
        state.errors.positions = null;
      })
      .addCase(fetchDashboardPositions.rejected, (state, action) => {
        state.loading.positions = false;
        state.errors.positions = action.payload as string;
      })
      
      // Fetch wallets
      .addCase(fetchDashboardWallets.pending, (state) => {
        state.loading.wallets = true;
        state.errors.wallets = null;
      })
      .addCase(fetchDashboardWallets.fulfilled, (state, action: PayloadAction<DashboardWalletsResponse>) => {
        state.loading.wallets = false;
        state.wallets = action.payload;
        state.errors.wallets = null;
      })
      .addCase(fetchDashboardWallets.rejected, (state, action) => {
        state.loading.wallets = false;
        state.errors.wallets = action.payload as string;
      })
      
      // Fetch trade P&L
      .addCase(fetchDashboardTradePnL.pending, (state) => {
        state.loading.tradePnL = true;
        state.errors.tradePnL = null;
      })
      .addCase(fetchDashboardTradePnL.fulfilled, (state, action: PayloadAction<DashboardTradePnLResponse>) => {
        state.loading.tradePnL = false;
        state.tradePnL = action.payload;
        state.errors.tradePnL = null;
      })
      .addCase(fetchDashboardTradePnL.rejected, (state, action) => {
        state.loading.tradePnL = false;
        state.errors.tradePnL = action.payload as string;
      })
      
      // Fetch transactions
      .addCase(fetchDashboardTransactions.pending, (state) => {
        state.loading.transactions = true;
        state.errors.transactions = null;
      })
      .addCase(fetchDashboardTransactions.fulfilled, (state, action: PayloadAction<DashboardTransactionsResponse>) => {
        state.loading.transactions = false;
        state.transactions = action.payload;
        state.errors.transactions = null;
      })
      .addCase(fetchDashboardTransactions.rejected, (state, action) => {
        state.loading.transactions = false;
        state.errors.transactions = action.payload as string;
      });
  },
});

export const { setTimeframe, clearError, clearAllErrors } = newDashboardSlice.actions;

// Selectors for getting data filtered by timeframe
export const selectDashboardDataByTimeframe = (state: any, timeframe: string) => {
  const { positions, wallets, tradePnL, transactions } = state.newDashboard;

  // If data is not loaded yet, return null
  if (!positions || !tradePnL || !transactions) {
    return null;
  }

  return {
    positions: {
      summary: positions.summary, // Current totals, not filtered by timeframe
      chartData: positions.chartData,
      performance: positions.performance,
    },
    wallets: {
      summary: wallets?.summary, // Current balances
      chartData: wallets?.chartData,
      recentActivity: wallets?.recentActivity,
    },
    tradePnL: {
      total: tradePnL.allTimeframeTotals?.[timeframe] || tradePnL.total,
      statistics: tradePnL.statistics,
      chartData: tradePnL.chartData,
      recent: tradePnL.recent,
    },
    transactions: {
      deposits: {
        ...(transactions.depositsByTimeframe?.[timeframe] || transactions.deposits),
        recentActivity: transactions.deposits.recentActivity,
        chartData: transactions.deposits.chartData,
      },
      withdrawals: {
        ...(transactions.withdrawalsByTimeframe?.[timeframe] || transactions.withdrawals),
        recentActivity: transactions.withdrawals.recentActivity,
        chartData: transactions.withdrawals.chartData,
      },
    },
  };
};

export default newDashboardSlice.reducer;
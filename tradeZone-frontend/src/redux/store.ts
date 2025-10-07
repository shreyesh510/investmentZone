import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import priceReducer from './slices/priceSlice';
import openaiReducer from './slices/openaiSlice';
import withdrawalsReducer from './slices/withdrawalsSlice';
import depositsReducer from './slices/depositsSlice';
import walletsReducer from './slices/walletsSlice';
import tradePnLReducer from './slices/tradePnLSlice';
import pnlLimitsReducer from './slices/pnlLimitsSlice';
import dashboardReducer from './slices/dashboardSlice';
import newDashboardReducer from './slices/newDashboardSlice';
import tradingReducer from './slices/tradingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    price: priceReducer,
    openai: openaiReducer,
    withdrawals: withdrawalsReducer,
    deposits: depositsReducer,
    wallets: walletsReducer,
    tradePnL: tradePnLReducer,
    pnlLimits: pnlLimitsReducer,
    dashboard: dashboardReducer,
    newDashboard: newDashboardReducer,
    trading: tradingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



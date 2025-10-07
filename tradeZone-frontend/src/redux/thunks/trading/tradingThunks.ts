import { createAsyncThunk } from '@reduxjs/toolkit';
import { tradingPnLApi, tradingWalletApi } from '../../../services/trading/tradingApi';
import type { TradingPnL, TradingWallet, DailySummary, WalletBalance } from '../../../types/trading';

// Trading P&L Thunks
export const fetchTradingPnL = createAsyncThunk(
  'trading/fetchPnL',
  async (date?: string, { rejectWithValue }) => {
    try {
      const data = await tradingPnLApi.getAll(date);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trading P&L');
    }
  }
);

export const createTradingPnL = createAsyncThunk(
  'trading/createPnL',
  async (
    data: Omit<TradingPnL, 'id' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>,
    { rejectWithValue }
  ) => {
    try {
      const result = await tradingPnLApi.create(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create trading P&L');
    }
  }
);

export const updateTradingPnL = createAsyncThunk(
  'trading/updatePnL',
  async ({ id, data }: { id: string; data: Partial<TradingPnL> }, { rejectWithValue }) => {
    try {
      await tradingPnLApi.update(id, data);
      return { id };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update trading P&L');
    }
  }
);

export const deleteTradingPnL = createAsyncThunk(
  'trading/deletePnL',
  async (id: string, { rejectWithValue }) => {
    try {
      await tradingPnLApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete trading P&L');
    }
  }
);

export const fetchDailySummary = createAsyncThunk(
  'trading/fetchDailySummary',
  async (date: string, { rejectWithValue }) => {
    try {
      const data = await tradingPnLApi.getDailySummary(date);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch daily summary');
    }
  }
);

export const fetchTradingPnLHistory = createAsyncThunk(
  'trading/fetchPnLHistory',
  async (limit?: number, { rejectWithValue }) => {
    try {
      const data = await tradingPnLApi.getHistory(limit);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch P&L history');
    }
  }
);

// Trading Wallet Thunks
export const fetchTradingWallets = createAsyncThunk(
  'trading/fetchWallets',
  async (_, { rejectWithValue }) => {
    try {
      const data = await tradingWalletApi.getAll();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trading wallets');
    }
  }
);

export const createTradingWallet = createAsyncThunk(
  'trading/createWallet',
  async (
    data: Omit<TradingWallet, 'id' | 'createdAt' | 'updatedAt'>,
    { rejectWithValue }
  ) => {
    try {
      const result = await tradingWalletApi.create(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create trading wallet');
    }
  }
);

export const updateTradingWallet = createAsyncThunk(
  'trading/updateWallet',
  async ({ id, data }: { id: string; data: Partial<TradingWallet> }, { rejectWithValue }) => {
    try {
      await tradingWalletApi.update(id, data);
      return { id };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update trading wallet');
    }
  }
);

export const deleteTradingWallet = createAsyncThunk(
  'trading/deleteWallet',
  async (id: string, { rejectWithValue }) => {
    try {
      await tradingWalletApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete trading wallet');
    }
  }
);

export const fetchWalletBalance = createAsyncThunk(
  'trading/fetchWalletBalance',
  async (_, { rejectWithValue }) => {
    try {
      const data = await tradingWalletApi.getTotalBalance();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet balance');
    }
  }
);

export const fetchTradingWalletHistory = createAsyncThunk(
  'trading/fetchWalletHistory',
  async (limit?: number, { rejectWithValue }) => {
    try {
      const data = await tradingWalletApi.getHistory(limit);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet history');
    }
  }
);

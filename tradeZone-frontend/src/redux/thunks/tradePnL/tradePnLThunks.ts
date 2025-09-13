import { createAsyncThunk } from '@reduxjs/toolkit';
import { tradePnLApi, type TradePnLDto } from '../../../services/tradePnLApi';

export const fetchTradePnL = createAsyncThunk<TradePnLDto[], number | undefined, { rejectValue: string }>(
  'tradePnL/fetch',
  async (days, { rejectWithValue }) => {
    try {
      return await tradePnLApi.list(days);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch trade P&L records');
    }
  },
);

export const createTradePnL = createAsyncThunk<TradePnLDto, { date: string; symbol?: string; side?: string; profit: number; loss: number; netPnL: number; notes?: string; totalTrades?: number; winningTrades?: number; losingTrades?: number }, { rejectValue: string }>(
  'tradePnL/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await tradePnLApi.create(payload);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to create trade P&L record');
    }
  },
);

export const updateTradePnL = createAsyncThunk<{ id: string; success: boolean; patch: Partial<TradePnLDto> }, { id: string; patch: Partial<TradePnLDto> }, { rejectValue: string }>(
  'tradePnL/update',
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      const res = await tradePnLApi.update(id, patch);
      return { id, success: res.success, patch };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to update trade P&L record');
    }
  }
);

export const deleteTradePnL = createAsyncThunk<{ id: string; success: boolean }, { id: string }, { rejectValue: string }>(
  'tradePnL/delete',
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await tradePnLApi.remove(id);
      return { id, success: res.success };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to delete trade P&L record');
    }
  }
);

export const fetchTradePnLStatistics = createAsyncThunk<any, number | undefined, { rejectValue: string }>(
  'tradePnL/fetchStatistics',
  async (days, { rejectWithValue }) => {
    try {
      return await tradePnLApi.getStatistics(days);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);
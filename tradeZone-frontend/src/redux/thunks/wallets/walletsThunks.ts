import { createAsyncThunk } from '@reduxjs/toolkit';
import { walletsApi, type WalletDto, type WalletHistoryItem } from '../../../services/walletsApi';

export const fetchWallets = createAsyncThunk<WalletDto[], void, { rejectValue: string }>(
  'wallets/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await walletsApi.list();
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch wallets');
    }
  },
);

export const createWallet = createAsyncThunk<WalletDto, { name: string; type?: 'demat' | 'bank'; platform?: string; currency?: string; address?: string; notes?: string; balance?: number }, { rejectValue: string }>(
  'wallets/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await walletsApi.create(payload);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to create wallet');
    }
  },
);

export const updateWallet = createAsyncThunk<{ id: string; success: boolean; patch: Partial<WalletDto> }, { id: string; patch: Partial<WalletDto> }, { rejectValue: string }>(
  'wallets/update',
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      const res = await walletsApi.update(id, patch);
      return { id, success: res.success, patch };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to update wallet');
    }
  }
);

export const deleteWallet = createAsyncThunk<{ id: string; success: boolean }, { id: string }, { rejectValue: string }>(
  'wallets/delete',
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await walletsApi.remove(id);
      return { id, success: res.success };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to delete wallet');
    }
  }
);

export const fetchWalletHistory = createAsyncThunk<WalletHistoryItem[], { limit?: number } | void, { rejectValue: string }>(
  'wallets/history',
  async (args, { rejectWithValue }) => {
    try {
      const limit = args && 'limit' in (args as any) ? (args as any).limit as number | undefined : undefined;
      return await walletsApi.history(limit);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch wallet history');
    }
  },
);

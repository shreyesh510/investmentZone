import { createAsyncThunk } from '@reduxjs/toolkit';
import { withdrawalsApi, type WithdrawalDto } from '../../../services/withdrawalsApi';

export const fetchWithdrawals = createAsyncThunk<WithdrawalDto[], void, { rejectValue: string }>(
  'withdrawals/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await withdrawalsApi.list();
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch withdrawals');
    }
  },
);

export const createWithdrawal = createAsyncThunk<WithdrawalDto, { amount: number; method?: string; description?: string }, { rejectValue: string }>(
  'withdrawals/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await withdrawalsApi.create(payload);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to create withdrawal');
    }
  },
);

export const updateWithdrawal = createAsyncThunk<{ id: string; success: boolean; patch: Partial<WithdrawalDto> }, { id: string; patch: Partial<WithdrawalDto> }, { rejectValue: string }>(
  'withdrawals/update',
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      const res = await withdrawalsApi.update(id, patch);
      return { id, success: res.success, patch };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to update withdrawal');
    }
  }
);

export const deleteWithdrawal = createAsyncThunk<{ id: string; success: boolean }, { id: string }, { rejectValue: string }>(
  'withdrawals/delete',
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await withdrawalsApi.remove(id);
      return { id, success: res.success };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to delete withdrawal');
    }
  }
);

import { createAsyncThunk } from '@reduxjs/toolkit';
import { depositsApi, type DepositDto } from '../../../services/depositsApi';

export const fetchDeposits = createAsyncThunk<DepositDto[], void, { rejectValue: string }>(
  'deposits/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await depositsApi.list();
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch deposits');
    }
  },
);

export const createDeposit = createAsyncThunk<DepositDto, { amount: number; method?: string; description?: string }, { rejectValue: string }>(
  'deposits/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await depositsApi.create(payload);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to create deposit');
    }
  },
);

export const updateDeposit = createAsyncThunk<{ id: string; success: boolean; patch: Partial<DepositDto> }, { id: string; patch: Partial<DepositDto> }, { rejectValue: string }>(
  'deposits/update',
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      const res = await depositsApi.update(id, patch);
      return { id, success: res.success, patch };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to update deposit');
    }
  }
);

export const deleteDeposit = createAsyncThunk<{ id: string; success: boolean }, { id: string }, { rejectValue: string }>(
  'deposits/delete',
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await depositsApi.remove(id);
      return { id, success: res.success };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to delete deposit');
    }
  }
);

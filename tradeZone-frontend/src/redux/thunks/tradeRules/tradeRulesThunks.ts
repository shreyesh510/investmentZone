import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  tradeRulesApi,
  type TradeRuleDto,
  type CreateTradeRuleDto,
  type UpdateTradeRuleDto,
  type ViolationAnalysis
} from '../../../services/tradeRulesApi';

export const fetchTradeRules = createAsyncThunk<
  TradeRuleDto[],
  { category?: string; isActive?: boolean; importance?: string } | undefined,
  { rejectValue: string }
>(
  'tradeRules/fetch',
  async (filters, { rejectWithValue }) => {
    try {
      return await tradeRulesApi.list(filters);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch trade rules');
    }
  },
);

export const createTradeRule = createAsyncThunk<
  TradeRuleDto,
  CreateTradeRuleDto,
  { rejectValue: string }
>(
  'tradeRules/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await tradeRulesApi.create(payload);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to create trade rule');
    }
  },
);

export const updateTradeRule = createAsyncThunk<
  { id: string; success: boolean; patch: Partial<TradeRuleDto> },
  { id: string; patch: UpdateTradeRuleDto },
  { rejectValue: string }
>(
  'tradeRules/update',
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      const res = await tradeRulesApi.update(id, patch);
      return { id, success: res.success, patch };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to update trade rule');
    }
  }
);

export const deleteTradeRule = createAsyncThunk<
  { id: string; success: boolean },
  { id: string },
  { rejectValue: string }
>(
  'tradeRules/delete',
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await tradeRulesApi.remove(id);
      return { id, success: res.success };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to delete trade rule');
    }
  }
);

export const recordViolation = createAsyncThunk<
  TradeRuleDto,
  { id: string },
  { rejectValue: string }
>(
  'tradeRules/recordViolation',
  async ({ id }, { rejectWithValue }) => {
    try {
      return await tradeRulesApi.recordViolation(id);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Failed to record violation');
    }
  }
);

export const fetchViolationAnalysis = createAsyncThunk<
  ViolationAnalysis,
  void,
  { rejectValue: string }
>(
  'tradeRules/fetchViolationAnalysis',
  async (_, { rejectWithValue }) => {
    try {
      return await tradeRulesApi.getViolationAnalysis();
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch violation analysis');
    }
  }
);
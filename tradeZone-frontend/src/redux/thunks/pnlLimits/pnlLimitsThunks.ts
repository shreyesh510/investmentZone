import { createAsyncThunk } from '@reduxjs/toolkit';
import { tradeRulesApi } from '../../../services/tradeRulesApi';
import {
  fetchPnlLimitsStart,
  fetchPnlLimitsSuccess,
  fetchPnlLimitsFailure,
  updatePnlLimitsStart,
  updatePnlLimitsSuccess,
  updatePnlLimitsFailure,
} from '../../slices/pnlLimitsSlice';

export const fetchPnlLimits = createAsyncThunk(
  'pnlLimits/fetchPnlLimits',
  async (_, { dispatch }) => {
    try {
      dispatch(fetchPnlLimitsStart());
      const pnlLimits = await tradeRulesApi.getPnlLimits();
      dispatch(fetchPnlLimitsSuccess(pnlLimits));
      return pnlLimits;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch PnL limits';
      dispatch(fetchPnlLimitsFailure(errorMessage));
      throw error;
    }
  }
);

export const updatePnlLimits = createAsyncThunk(
  'pnlLimits/updatePnlLimits',
  async (pnlLimits: { lossAmount?: number; profitAmount?: number }, { dispatch }) => {
    try {
      dispatch(updatePnlLimitsStart());
      const updatedPnlLimits = await tradeRulesApi.updatePnlLimits(pnlLimits);
      dispatch(updatePnlLimitsSuccess(updatedPnlLimits));
      return updatedPnlLimits;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update PnL limits';
      dispatch(updatePnlLimitsFailure(errorMessage));
      throw error;
    }
  }
);
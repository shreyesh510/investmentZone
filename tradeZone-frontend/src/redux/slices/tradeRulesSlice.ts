import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TradeRuleDto, ViolationAnalysis } from '../../services/tradeRulesApi';
import {
  fetchTradeRules,
  createTradeRule,
  updateTradeRule,
  deleteTradeRule,
  recordViolation,
  fetchViolationAnalysis
} from '../thunks/tradeRules/tradeRulesThunks';

interface TradeRulesState {
  items: TradeRuleDto[];
  violationAnalysis: ViolationAnalysis | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  recordingViolation: boolean;
  error: string | null;
}

const initialState: TradeRulesState = {
  items: [],
  violationAnalysis: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  recordingViolation: false,
  error: null,
};

const tradeRulesSlice = createSlice({
  name: 'tradeRules',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    toggleRuleActive: (state, action: PayloadAction<string>) => {
      const rule = state.items.find(item => item.id === action.payload);
      if (rule) {
        rule.isActive = !rule.isActive;
      }
    },
    resetViolations: (state, action: PayloadAction<string>) => {
      const rule = state.items.find(item => item.id === action.payload);
      if (rule) {
        rule.violations = 0;
        rule.lastViolation = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Trade Rules
      .addCase(fetchTradeRules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTradeRules.fulfilled, (state, action: PayloadAction<TradeRuleDto[]>) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchTradeRules.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch trade rules';
      })

      // Create Trade Rule
      .addCase(createTradeRule.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTradeRule.fulfilled, (state, action: PayloadAction<TradeRuleDto>) => {
        state.creating = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createTradeRule.rejected, (state, action) => {
        state.creating = false;
        state.error = (action.payload as string) ?? 'Failed to create trade rule';
      })

      // Update Trade Rule
      .addCase(updateTradeRule.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateTradeRule.fulfilled, (state, action) => {
        state.updating = false;
        if (!action.payload.success) return;
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = { ...state.items[idx], ...(action.payload.patch as any) } as any;
        }
      })
      .addCase(updateTradeRule.rejected, (state, action) => {
        state.updating = false;
        state.error = (action.payload as string) ?? 'Failed to update trade rule';
      })

      // Delete Trade Rule
      .addCase(deleteTradeRule.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteTradeRule.fulfilled, (state, action) => {
        state.deleting = false;
        if (!action.payload.success) return;
        state.items = state.items.filter((item) => item.id !== action.payload.id);
      })
      .addCase(deleteTradeRule.rejected, (state, action) => {
        state.deleting = false;
        state.error = (action.payload as string) ?? 'Failed to delete trade rule';
      })

      // Record Violation
      .addCase(recordViolation.pending, (state) => {
        state.recordingViolation = true;
        state.error = null;
      })
      .addCase(recordViolation.fulfilled, (state, action: PayloadAction<TradeRuleDto>) => {
        state.recordingViolation = false;
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        }
      })
      .addCase(recordViolation.rejected, (state, action) => {
        state.recordingViolation = false;
        state.error = (action.payload as string) ?? 'Failed to record violation';
      })

      // Fetch Violation Analysis
      .addCase(fetchViolationAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchViolationAnalysis.fulfilled, (state, action: PayloadAction<ViolationAnalysis>) => {
        state.loading = false;
        state.violationAnalysis = action.payload;
      })
      .addCase(fetchViolationAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch violation analysis';
      });
  },
});

export const { clearError, toggleRuleActive, resetViolations } = tradeRulesSlice.actions;

export default tradeRulesSlice.reducer;
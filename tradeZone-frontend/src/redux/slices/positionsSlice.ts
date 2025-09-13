import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  fetchPositions,
  fetchPosition,
  createPosition,
  updatePosition,
  deletePosition,
  fetchOpenPositions,
  fetchClosedPositions,
  fetchDashboardPositions,
} from '../thunks/positions/positionsThunks';
import type { Position, PositionLike, PositionFilters } from '../../types/position';

interface DashboardPositionsData {
  summary: {
    totalPositions: number;
    totalInvested: number;
    totalPnL: number;
  };
  chartData: {
    daily: any[];
    weekly: any[];
    monthly: any[];
    yearly: any[];
  };
  performance: {
    dayChange: number;
    percentChange: number;
  };
}

interface PositionsState {
  positions: PositionLike[];
  openPositions: Position[];
  closedPositions: Position[];
  currentPosition: Position | null;
  dashboardData: DashboardPositionsData | null;
  loading: boolean;
  openLoading: boolean;
  closedLoading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  dashboardLoading: boolean;
  error: string | null;
  filters: PositionFilters;
  lastUpdated: number | null;
}

const initialState: PositionsState = {
  positions: [],
  openPositions: [],
  closedPositions: [],
  currentPosition: null,
  dashboardData: null,
  loading: false,
  openLoading: false,
  closedLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  dashboardLoading: false,
  error: null,
  filters: { status: 'all' },
  lastUpdated: null,
};

const positionsSlice = createSlice({
  name: 'positions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPosition: (state) => {
      state.currentPosition = null;
    },
    setFilters: (state, action: PayloadAction<PositionFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { status: 'all' };
    },
    updatePositionInList: (state, action: PayloadAction<Position>) => {
      const updatedPosition = action.payload;
      
      // Update in main positions array
      const index = state.positions.findIndex((p) => 'id' in p && p.id === updatedPosition.id);
      if (index !== -1) {
        // Cast safe since we only replace an element that had an id
        (state.positions as unknown as Position[])[index] = updatedPosition;
      }
      
      // Update in open positions if it's open
      if (updatedPosition.status === 'open') {
        const openIndex = state.openPositions.findIndex(p => p.id === updatedPosition.id);
        if (openIndex !== -1) {
          state.openPositions[openIndex] = updatedPosition;
        } else {
          state.openPositions.unshift(updatedPosition);
        }
      } else {
        // Remove from open positions if closed
        state.openPositions = state.openPositions.filter(p => p.id !== updatedPosition.id);
      }
      
      // Update in closed positions if it's closed
      if (updatedPosition.status === 'closed') {
        const closedIndex = state.closedPositions.findIndex(p => p.id === updatedPosition.id);
        if (closedIndex !== -1) {
          state.closedPositions[closedIndex] = updatedPosition;
        } else {
          state.closedPositions.unshift(updatedPosition);
        }
      } else {
        // Remove from closed positions if reopened
        state.closedPositions = state.closedPositions.filter(p => p.id !== updatedPosition.id);
      }
    },
    removePositionFromList: (state, action: PayloadAction<string>) => {
      const positionId = action.payload;
      state.positions = state.positions.filter((p) => !('id' in p) || p.id !== positionId);
      state.openPositions = state.openPositions.filter(p => p.id !== positionId);
      state.closedPositions = state.closedPositions.filter(p => p.id !== positionId);
      
      if (state.currentPosition?.id === positionId) {
        state.currentPosition = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all positions
      .addCase(fetchPositions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
  .addCase(fetchPositions.fulfilled, (state, action: PayloadAction<PositionLike[]>) => {
        state.loading = false;
        state.positions = action.payload;
        state.error = null;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchPositions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch single position
      .addCase(fetchPosition.fulfilled, (state, action: PayloadAction<Position>) => {
        state.currentPosition = action.payload;
      })
      .addCase(fetchPosition.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Create position
      .addCase(createPosition.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createPosition.fulfilled, (state, action: PayloadAction<Position>) => {
        state.createLoading = false;
        state.positions.unshift(action.payload);
        
        if (action.payload.status === 'open') {
          state.openPositions.unshift(action.payload);
        } else {
          state.closedPositions.unshift(action.payload);
        }
        
        state.error = null;
        state.lastUpdated = Date.now();
      })
      .addCase(createPosition.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      })
      
      // Update position
      .addCase(updatePosition.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updatePosition.fulfilled, (state, action: PayloadAction<Position>) => {
        state.updateLoading = false;
        const updatedPosition = action.payload;
        
        // Update in main positions array
        const index = state.positions.findIndex((p) => 'id' in p && p.id === updatedPosition.id);
        if (index !== -1) {
          (state.positions as unknown as Position[])[index] = updatedPosition;
        }
        
        // Update in open positions if it's open
        if (updatedPosition.status === 'open') {
          const openIndex = state.openPositions.findIndex(p => p.id === updatedPosition.id);
          if (openIndex !== -1) {
            state.openPositions[openIndex] = updatedPosition;
          } else {
            state.openPositions.unshift(updatedPosition);
          }
        } else {
          // Remove from open positions if closed
          state.openPositions = state.openPositions.filter(p => p.id !== updatedPosition.id);
        }
        
        // Update in closed positions if it's closed
        if (updatedPosition.status === 'closed') {
          const closedIndex = state.closedPositions.findIndex(p => p.id === updatedPosition.id);
          if (closedIndex !== -1) {
            state.closedPositions[closedIndex] = updatedPosition;
          } else {
            state.closedPositions.unshift(updatedPosition);
          }
        } else {
          // Remove from closed positions if reopened
          state.closedPositions = state.closedPositions.filter(p => p.id !== updatedPosition.id);
        }
        
        // Update current position if it's the one being updated
        if (state.currentPosition?.id === updatedPosition.id) {
          state.currentPosition = updatedPosition;
        }
        
        state.error = null;
        state.lastUpdated = Date.now();
      })
      .addCase(updatePosition.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete position
      .addCase(deletePosition.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deletePosition.fulfilled, (state, action: PayloadAction<string>) => {
        state.deleteLoading = false;
        const positionId = action.payload;
        
        state.positions = state.positions.filter((p) => !('id' in p) || p.id !== positionId);
        state.openPositions = state.openPositions.filter(p => p.id !== positionId);
        state.closedPositions = state.closedPositions.filter(p => p.id !== positionId);
        
        if (state.currentPosition?.id === positionId) {
          state.currentPosition = null;
        }
        
        state.error = null;
        state.lastUpdated = Date.now();
      })
      .addCase(deletePosition.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch open positions
      .addCase(fetchOpenPositions.pending, (state) => {
        state.openLoading = true;
        state.error = null;
      })
      .addCase(fetchOpenPositions.fulfilled, (state, action: PayloadAction<Position[]>) => {
        state.openLoading = false;
        state.openPositions = action.payload;
        state.error = null;
      })
      .addCase(fetchOpenPositions.rejected, (state, action) => {
        state.openLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch closed positions
      .addCase(fetchClosedPositions.pending, (state) => {
        state.closedLoading = true;
        state.error = null;
      })
      .addCase(fetchClosedPositions.fulfilled, (state, action: PayloadAction<Position[]>) => {
        state.closedLoading = false;
        state.closedPositions = action.payload;
        state.error = null;
      })
      .addCase(fetchClosedPositions.rejected, (state, action) => {
        state.closedLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch dashboard positions
      .addCase(fetchDashboardPositions.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardPositions.fulfilled, (state, action: PayloadAction<DashboardPositionsData>) => {
        state.dashboardLoading = false;
        state.dashboardData = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardPositions.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload as string;
      })
  // Bulk import removed
  // Close all positions removed
  },
});

export const {
  clearError,
  clearCurrentPosition,
  setFilters,
  clearFilters,
  updatePositionInList,
  removePositionFromList,
} = positionsSlice.actions;

export default positionsSlice.reducer;

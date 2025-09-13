import getAxios from '../utils/interceptor/axiosInterceptor';
import type { Position, AggregatedPosition, PositionLike, CreatePositionData, UpdatePositionData, PositionFilters } from '../types/position';

export const positionsApi = {
  // Get all positions with optional filters
  getPositions: async (filters?: PositionFilters): Promise<PositionLike[]> => {
  // removed debug log

    // If no filters, use the new backend endpoint that includes P&L
    if (!filters || Object.keys(filters).length === 0) {
      // Prefer open aggregated with representative=latest to include ids for per-card actions
      const url = '/positions?status=open&aggregated=true&representative=latest';
  // removed debug log
      const response = await getAxios.get(url);
  // removed debug logs
      return response.data as AggregatedPosition[];
    }

    // Otherwise fall back to the generic /positions with query params
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.side) {
      params.append('side', filters.side);
    }
    if (filters?.platform) {
      params.append('platform', filters.platform);
    }
    if (filters?.account) {
      params.append('account', filters.account);
    }
    if (filters?.timeframe) {
      params.append('timeframe', filters.timeframe);
    }
    if (filters?.symbol) {
      params.append('symbol', filters.symbol);
    }
    const url = `/positions?${params.toString()}`;
  // removed debug log
    const response = await getAxios.get(url);
  // removed debug logs
  return response.data as Position[];
  },

  // Get a specific position by ID
  getPosition: async (id: string): Promise<Position> => {
    const response = await getAxios.get(`/positions/${id}`);
    return response.data;
  },

  // Create a new position
  createPosition: async (data: CreatePositionData): Promise<Position> => {
    const response = await getAxios.post('/positions', data);
    return response.data;
  },

  // Update an existing position
  updatePosition: async (id: string, data: UpdatePositionData): Promise<Position> => {
    const response = await getAxios.patch(`/positions/${id}`, data);
    return response.data;
  },

  // Delete a position
  deletePosition: async (id: string): Promise<{ message: string }> => {
    const response = await getAxios.delete(`/positions/${id}`);
    return response.data;
  },

  // Get only open positions
  getOpenPositions: async (): Promise<Position[]> => {
    const response = await getAxios.get('/positions/open/list');
    return response.data;
  },

  // Get only closed positions
  getClosedPositions: async (): Promise<Position[]> => {
    const response = await getAxios.get('/positions/closed/list');
    return response.data;
  },



  // Get recent position history activities
  getHistory: async (limit = 20): Promise<any[]> => {
    const response = await getAxios.get(`/positions/history?limit=${limit}`);
    return response.data as any[];
  },

  // Bulk import positions
  importPositions: async (items: any[], account?: 'main' | 'longterm') => {
    const response = await getAxios.post('/positions/multi', { items, account });
    return response.data as { created: number; skipped: number; ids: string[] };
  },
};

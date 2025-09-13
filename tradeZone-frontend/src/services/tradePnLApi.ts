import getAxios from '../utils/interceptor/axiosInterceptor';

export interface TradePnLDto {
  id: string;
  date: string;
  symbol?: string;
  side?: string;
  profit: number;
  loss: number;
  netPnL: number;
  notes?: string;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradePnLPaginatedResponse {
  data: TradePnLDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statistics: {
    totalProfit: number;
    totalLoss: number;
    netPnL: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: string;
    averageDailyPnL: string;
    daysTraded: number;
    period: string;
  };
}

export const tradePnLApi = {
  list: async (days?: number): Promise<TradePnLDto[]> => {
    const url = `/trade-pnl${days ? `?days=${days}` : ''}`;
    const res = await getAxios.get(url);
    return res.data;
  },

  listPaginated: async (
    days?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<TradePnLPaginatedResponse> => {
    let url = `/trade-pnl?page=${page}&limit=${limit}`;
    if (days) url += `&days=${days}`;
    const res = await getAxios.get(url);
    return res.data;
  },
  
  create: async (data: { date: string; symbol?: string; side?: string; profit: number; loss: number; netPnL: number; notes?: string; totalTrades?: number; winningTrades?: number; losingTrades?: number }): Promise<TradePnLDto> => {
    const res = await getAxios.post('/trade-pnl', data);
    return res.data;
  },
  
  async update(id: string, payload: Partial<{ symbol?: string; side?: string; profit: number; loss: number; netPnL: number; notes?: string; totalTrades?: number; winningTrades?: number; losingTrades?: number }>) {
    const res = await getAxios.patch<{ success: boolean }>(`/trade-pnl/${id}`, payload);
    return res.data;
  },
  
  async remove(id: string) {
    const res = await getAxios.delete<{ success: boolean }>(`/trade-pnl/${id}`);
    return res.data;
  },
  
  async getById(id: string): Promise<TradePnLDto> {
    const res = await getAxios.get(`/trade-pnl/${id}`);
    return res.data;
  },
  
  async getByDate(date: string): Promise<TradePnLDto | null> {
    try {
      const res = await getAxios.get(`/trade-pnl/by-date/${date}`);
      return res.data;
    } catch (error) {
      return null;
    }
  },
  
  async getStatistics(days?: number): Promise<any> {
    const url = `/trade-pnl/statistics${days ? `?days=${days}` : ''}`;
    const res = await getAxios.get(url);
    return res.data;
  },

  bulkImport: async (items: Array<{ date: string; symbol?: string; side?: string; profit: number; loss: number; netPnL: number; notes?: string; totalTrades?: number; winningTrades?: number; losingTrades?: number }>): Promise<{ created: number; skipped: number; errors: string[] }> => {
    const res = await getAxios.post('/trade-pnl/bulk-import', { items }, {
      timeout: 60000 // 60 seconds timeout for bulk import operations
    });
    return res.data;
  }
};
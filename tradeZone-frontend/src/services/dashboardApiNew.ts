import getAxios from '../utils/interceptor/axiosInterceptor';

// API interfaces for the new 4-endpoint structure
export interface DashboardPositionsResponse {
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
  timeframe?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface DashboardWalletsResponse {
  summary: {
    dematWallet: {
      balance: number;
      currency: string;
      count: number;
    };
    bankWallet: {
      balance: number;
      currency: string;
      count: number;
    };
  };
  chartData: {
    daily: any[];
    weekly: any[];
    monthly: any[];
    yearly: any[];
  };
  recentActivity: any[];
  timeframe?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface DashboardTradePnLResponse {
  total: {
    profit: number;
    loss: number;
    netPnL: number;
    trades: number;
  };
  statistics: any;
  chartData: {
    daily: any[];
    weekly: any[];
    monthly: any[];
    yearly: any[];
  };
  recent: any[];
  timeframe?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface DashboardTransactionsResponse {
  deposits: {
    total: number;
    pending: number;
    completed: number;
    chartData: {
      daily: any[];
      weekly: any[];
      monthly: any[];
      yearly: any[];
    };
    recentActivity: any[];
  };
  withdrawals: {
    total: number;
    pending: number;
    completed: number;
    chartData: {
      daily: any[];
      weekly: any[];
      monthly: any[];
      yearly: any[];
    };
    recentActivity: any[];
  };
  timeframe?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export const newDashboardApi = {
  // Get positions data
  getPositions: async (timeframe: string = '1M'): Promise<DashboardPositionsResponse> => {
    const response = await getAxios.get(`/dashboard/positions?timeframe=${timeframe}`);
    return response.data;
  },

  // Get wallets data
  getWallets: async (timeframe: string = '1M'): Promise<DashboardWalletsResponse> => {
    const response = await getAxios.get(`/dashboard/wallets?timeframe=${timeframe}`);
    return response.data;
  },

  // Get trade P&L data
  getTradePnL: async (timeframe: string = '1M'): Promise<DashboardTradePnLResponse> => {
    const response = await getAxios.get(`/dashboard/trade-pnl?timeframe=${timeframe}`);
    return response.data;
  },

  // Get transactions data
  getTransactions: async (timeframe: string = '1M'): Promise<DashboardTransactionsResponse> => {
    const response = await getAxios.get(`/dashboard/transactions?timeframe=${timeframe}`);
    return response.data;
  },

  // Get all dashboard data in parallel (for initial load)
  getAllDashboardData: async (timeframe: string = '1M') => {
    const [positions, wallets, tradePnL, transactions] = await Promise.allSettled([
      newDashboardApi.getPositions(timeframe),
      newDashboardApi.getWallets(timeframe),
      newDashboardApi.getTradePnL(timeframe),
      newDashboardApi.getTransactions(timeframe),
    ]);

    return {
      positions: positions.status === 'fulfilled' ? positions.value : null,
      wallets: wallets.status === 'fulfilled' ? wallets.value : null,
      tradePnL: tradePnL.status === 'fulfilled' ? tradePnL.value : null,
      transactions: transactions.status === 'fulfilled' ? transactions.value : null,
      errors: {
        positions: positions.status === 'rejected' ? positions.reason : null,
        wallets: wallets.status === 'rejected' ? wallets.reason : null,
        tradePnL: tradePnL.status === 'rejected' ? tradePnL.reason : null,
        transactions: transactions.status === 'rejected' ? transactions.reason : null,
      }
    };
  },
};
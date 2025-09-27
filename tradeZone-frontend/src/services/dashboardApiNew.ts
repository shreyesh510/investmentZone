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

export interface TimeframeFinancialData {
  timeframe: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  deposits: {
    total: number;
    count: number;
    pending: number;
    completed: number;
    chartData: any;
  };
  withdrawals: {
    total: number;
    count: number;
    pending: number;
    completed: number;
    chartData: any;
  };
  tradePnL: {
    totalProfit: number;
    totalLoss: number;
    netPnL: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: string;
    chartData: any;
  };
  positions: {
    total: number;
    open: number;
    closed: number;
    totalInvested: number;
    positionsPnL: number;
    chartData: any;
  };
  netCashFlow: number;
  overallPnL: number;
}

export interface ConsolidatedDashboardResponse {
  currentWallets: {
    dematWallet: {
      balance: number;
      currency: string;
      count: number;
      wallets: any[];
    };
    bankWallet: {
      balance: number;
      currency: string;
      count: number;
      wallets: any[];
    };
    totalBalance: {
      USD: number;
      INR: number;
    };
    recentActivity: any[];
  };
  financialByTimeframe: {
    [key: string]: TimeframeFinancialData;
  };
  tradePnLProgress: any;
  requestedTimeframe: string;
  customDateRange: {
    customStartDate?: string;
    customEndDate?: string;
  } | null;
  year: number;
  generatedAt: string;
  supportedTimeframes: string[];
}

export const newDashboardApi = {
  // Get consolidated dashboard data (single API call)
  getConsolidatedDashboard: async (
    timeframe: string = '1M',
    year?: number,
    customStartDate?: string,
    customEndDate?: string
  ): Promise<ConsolidatedDashboardResponse> => {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);
    if (year) {
      params.append('year', year.toString());
    }
    if (customStartDate) {
      params.append('customStartDate', customStartDate);
    }
    if (customEndDate) {
      params.append('customEndDate', customEndDate);
    }

    const response = await getAxios.get(`/dashboard?${params.toString()}`);
    return response.data;
  },

  // Get financial data for specific timeframe
  getFinancialDataByTimeframe: async (timeframe: string): Promise<TimeframeFinancialData | null> => {
    const data = await newDashboardApi.getConsolidatedDashboard(timeframe);
    return data.financialByTimeframe[timeframe] || null;
  },

  // Get financial data for custom date range
  getFinancialDataByDateRange: async (startDate: string, endDate: string): Promise<TimeframeFinancialData | null> => {
    const data = await newDashboardApi.getConsolidatedDashboard('CUSTOM', undefined, startDate, endDate);
    return data.financialByTimeframe['CUSTOM'] || null;
  },

  // Legacy methods for backward compatibility (these now use the consolidated API)
  getPositions: async (timeframe: string = '1M'): Promise<DashboardPositionsResponse> => {
    const data = await newDashboardApi.getConsolidatedDashboard(timeframe);
    return data.positions;
  },

  getWallets: async (timeframe: string = '1M'): Promise<DashboardWalletsResponse> => {
    const data = await newDashboardApi.getConsolidatedDashboard(timeframe);
    return data.wallets;
  },

  getTradePnL: async (timeframe: string = '1M'): Promise<DashboardTradePnLResponse> => {
    const data = await newDashboardApi.getConsolidatedDashboard(timeframe);
    return data.tradePnL;
  },

  getTransactions: async (timeframe: string = '1M'): Promise<DashboardTransactionsResponse> => {
    const data = await newDashboardApi.getConsolidatedDashboard(timeframe);
    return data.transactions;
  },

  // Get all dashboard data (now just uses consolidated API)
  getAllDashboardData: async (timeframe: string = '1M', year?: number) => {
    try {
      const data = await newDashboardApi.getConsolidatedDashboard(timeframe, year);
      return {
        positions: data.positions,
        wallets: data.wallets,
        tradePnL: data.tradePnL,
        transactions: data.transactions,
        summary: data.summary,
        financialSummary: data.financialSummary,
        tradePnLProgress: data.tradePnLProgress,
        errors: {
          positions: null,
          wallets: null,
          tradePnL: null,
          transactions: null,
        }
      };
    } catch (error) {
      console.error('Error fetching consolidated dashboard data:', error);
      return {
        positions: null,
        wallets: null,
        tradePnL: null,
        transactions: null,
        summary: null,
        financialSummary: null,
        tradePnLProgress: null,
        errors: {
          positions: error,
          wallets: error,
          tradePnL: error,
          transactions: error,
        }
      };
    }
  },

  // Get trade PnL progress data (GitHub-style contribution graph)
  getTradePnLProgress: async (year?: number): Promise<any> => {
    const data = await newDashboardApi.getConsolidatedDashboard('1M', year);
    return data.tradePnLProgress;
  }
};
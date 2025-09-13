import getAxios from '../utils/interceptor/axiosInterceptor';

export interface DashboardPositions {
  totalPositions: number;
  totalInvested: number;
  totalPnL: number;
}

export interface DematWallet {
  balance: number;
  currency: string;
  count: number;
}

export interface BankWallet {
  balance: number;
  currency: string;
  count: number;
}

export interface WalletActivity {
  id: string;
  walletId: string;
  walletName: string;
  action: string;
  previousBalance?: number;
  newBalance: number;
  amount: number;
  description: string;
  timestamp: string;
}

export interface DashboardWallets {
  dematWallet: DematWallet;
  bankWallet: BankWallet;
  recentActivity: WalletActivity[];
}

export interface TransactionSummary {
  list: any[];
  total: number;
  pending: number;
  completed: number;
  recentActivity: any[];
  chartData: {
    weekly: any[];
    monthly: any[];
    yearly: any[];
  };
}

export interface DashboardTransactions {
  deposits: TransactionSummary;
  withdrawals: TransactionSummary;
}

export interface TodayTradePnL {
  profit: number;
  loss: number;
  netPnL: number;
  trades: number;
}

export interface TradePnLStatistics {
  period: string;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: string;
  averageDailyPnL: string;
  daysTraded: number;
}

export interface ChartDataPoint {
  period: string;
  profit: number;
  loss: number;
  netPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
}

export interface DashboardTradePnL {
  today: TodayTradePnL;
  recent: any[];
  statistics: TradePnLStatistics;
  chartData: {
    weekly: ChartDataPoint[];
    monthly: ChartDataPoint[];
    yearly: ChartDataPoint[];
  };
}

export interface DashboardSummary {
  positions: DashboardPositions;
  wallets: DashboardWallets;
  transactions: DashboardTransactions;
  tradePnL: DashboardTradePnL;
}

// Import mock data
import mockData from '../data/dashboardMockData.json';

export const dashboardApi = {
  // Get dashboard summary data (using mock data for now)
  getDashboardSummary: async (days?: number): Promise<DashboardSummary> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data for now
    return mockData as DashboardSummary;
    
    /* API implementation (commented out for now):
    const params = new URLSearchParams();
    if (days) {
      params.append('days', days.toString());
    }
    
    const url = `/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await getAxios.get(url);
    return response.data as DashboardSummary;
    */
  },
};
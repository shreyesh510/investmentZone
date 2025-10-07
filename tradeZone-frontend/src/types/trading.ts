export interface TradingPnL {
  id: string;
  userId: string;
  userName: string;
  symbol: string;
  pnl: number;
  profit?: number;
  loss?: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradingWallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  platform?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailySummary {
  totalPnL: number;
  totalProfit: number;
  totalLoss: number;
  tradesCount: number;
  byUser: Record<string, { pnl: number; count: number }>;
  bySymbol: Record<string, { pnl: number; count: number }>;
}

export interface WalletBalance {
  totalBalance: number;
  byCurrency: Record<string, number>;
  wallets: TradingWallet[];
}

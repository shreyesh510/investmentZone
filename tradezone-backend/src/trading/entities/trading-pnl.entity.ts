export interface TradingPnL {
  id: string;
  userId: string;
  userName: string; // For filtering by user
  symbol: string;
  pnl: number;
  profit?: number;
  loss?: number;
  date: string; // Trading date
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

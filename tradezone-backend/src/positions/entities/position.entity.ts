export interface Position {
  id: string;
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice?: number;
  currentPrice?: number;
  lots: number;
  investedAmount: number;
  platform: 'Delta Exchange' | 'Groww';
  leverage?: number;
  account?: 'main' | 'longterm';
  timestamp?: string;
  status?: 'open' | 'closed';
  pnl?: number;
  pnlPercentage?: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  notes?: string;
}

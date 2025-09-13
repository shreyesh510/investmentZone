export interface Position {
  id: string;
  userId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice?: number;
  currentPrice?: number; // may be omitted; UI should use live price
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
  createdAt?: Date;
  updatedAt?: Date;
  closedAt?: Date;
  notes?: string;
}

// Aggregated response returned by /positions/getAllPositionsWithPnl
export interface AggregatedPosition {
  symbol: string;
  lots: number;
  investedAmount: number;
  side: 'buy' | 'sell';
  pnl: number;
  currentPrice: number | null;
  platform?: 'Delta Exchange' | 'Groww';
  account?: 'main' | 'longterm';
  id?: string; // representative leg id
  ids?: string[]; // all leg ids for this symbol
}

// Union for places that can handle either full Position or aggregated
export type PositionLike = Position | AggregatedPosition;

export interface CreatePositionData {
  symbol: string;
  side: 'buy' | 'sell';
  lots: number;
  entryPrice: number;
  currentPrice?: number; // optional; live price will be fetched client-side
  investedAmount: number;
  platform: 'Delta Exchange' | 'Groww';
  leverage?: number;
  account?: 'main' | 'longterm';
  tradingFee?: number;
  timestamp?: string;
  status?: 'open' | 'closed';
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
}

export interface UpdatePositionData {
  symbol?: string;
  side?: 'buy' | 'sell';
  lots?: number;
  entryPrice?: number;
  currentPrice?: number;
  investedAmount?: number;
  platform?: 'Delta Exchange' | 'Groww';
  leverage?: number;
  account?: 'main' | 'longterm';
  timestamp?: string;
  status?: 'open' | 'closed';
  pnl?: number;
  pnlPercentage?: number;
  stopLoss?: number;
  takeProfit?: number;
  closedAt?: Date;
  notes?: string;
}

export interface PositionFilters {
  status?: 'open' | 'closed' | 'all';
  symbol?: string;
  side?: 'buy' | 'sell';
  platform?: 'Delta Exchange' | 'Groww';
  account?: 'main' | 'longterm';
  timeframe?: '1D' | '7D' | '30D' | '90D' | 'all';
}

export interface PositionStats {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalPnL: number;
  totalPnLPercentage: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
}

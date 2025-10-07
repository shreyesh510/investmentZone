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

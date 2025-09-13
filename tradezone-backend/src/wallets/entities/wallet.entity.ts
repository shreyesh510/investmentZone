export interface Wallet {
  id: string;
  userId: string;
  name: string; // e.g., Grow, Delta Exchange Main, Delta Subaccount
  type?: 'demat' | 'bank'; // account type
  platform?: string; // optional platform/provider label
  balance?: number; // optional cached balance
  currency?: string; // e.g., USD, USDT
  address?: string; // optional reference/account identifier
  createdAt?: string | Date;
  updatedAt?: string | Date;
  notes?: string;
}

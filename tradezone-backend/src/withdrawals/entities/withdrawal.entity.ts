export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  method?: string; // e.g., UPI/Bank/Wallet
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
}

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  method?: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
}

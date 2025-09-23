export interface TradeRule {
  id: string;
  title: string;
  description: string;
  category: 'loss' | 'profit' | 'rule';
  importance: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
  violations: number;
  lastViolation?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
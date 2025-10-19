export type GoalType = 'financial' | 'challenge';
export type GoalStatus = 'active' | 'completed' | 'archived';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  type: GoalType;
  status: GoalStatus;

  // Financial goal fields
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;

  // Challenge goal fields
  totalDays?: number;
  completedDays?: number;
  completedDates?: string[]; // Array of dates when user marked as done

  // Common fields
  description?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

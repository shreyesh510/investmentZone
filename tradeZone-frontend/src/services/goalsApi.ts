import getAxios from '../utils/interceptor/axiosInterceptor';

export type GoalType = 'financial' | 'challenge';
export type GoalStatus = 'active' | 'completed' | 'archived';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  type: GoalType;
  status: GoalStatus;
  // Financial fields
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;
  // Challenge fields
  totalDays?: number;
  completedDays?: number;
  completedDates?: string[];
  // Common
  description?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDto {
  name: string;
  type: GoalType;
  status?: GoalStatus;
  // Financial fields
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;
  // Challenge fields
  totalDays?: number;
  completedDays?: number;
  completedDates?: string[];
  // Common
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateGoalDto {
  name?: string;
  status?: GoalStatus;
  // Financial fields
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;
  // Challenge fields
  totalDays?: number;
  completedDays?: number;
  completedDates?: string[];
  // Common
  description?: string;
  startDate?: string;
  endDate?: string;
}

export const goalsApi = {
  list: async (): Promise<Goal[]> => {
    const res = await getAxios.get('/goals');
    return res.data;
  },

  create: async (data: CreateGoalDto): Promise<Goal> => {
    const res = await getAxios.post('/goals', data);
    return res.data;
  },

  getById: async (id: string): Promise<Goal> => {
    const res = await getAxios.get(`/goals/${id}`);
    return res.data;
  },

  update: async (id: string, payload: UpdateGoalDto): Promise<{ success: boolean }> => {
    const res = await getAxios.patch(`/goals/${id}`, payload);
    return res.data;
  },

  markDayComplete: async (id: string): Promise<{ success: boolean }> => {
    const res = await getAxios.post(`/goals/${id}/complete-day`);
    return res.data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    const res = await getAxios.delete(`/goals/${id}`);
    return res.data;
  }
};

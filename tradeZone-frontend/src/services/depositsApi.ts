import getAxios from '../utils/interceptor/axiosInterceptor';

export interface DepositDto {
  id: string;
  amount: number;
  method?: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
}

export const depositsApi = {
  list: async (): Promise<DepositDto[]> => {
    const res = await getAxios.get('/deposits');
    return res.data;
  },
  create: async (data: { amount: number; method?: string; description?: string }): Promise<DepositDto> => {
    const res = await getAxios.post('/deposits', data);
    return res.data;
  },
  async update(id: string, payload: Partial<{ amount: number; description?: string; method?: string }>) {
    const res = await getAxios.patch<{ success: boolean }>(`/deposits/${id}`, payload);
    return res.data;
  },
  async remove(id: string) {
    const res = await getAxios.delete<{ success: boolean }>(`/deposits/${id}`);
    return res.data;
  }
};

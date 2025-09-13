import getAxios from '../utils/interceptor/axiosInterceptor';

export interface WithdrawalDto {
  id: string;
  amount: number;
  method?: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
}

export const withdrawalsApi = {
  list: async (): Promise<WithdrawalDto[]> => {
    const res = await getAxios.get('/withdrawals');
    return res.data;
  },
  create: async (data: { amount: number; method?: string; description?: string }): Promise<WithdrawalDto> => {
    const res = await getAxios.post('/withdrawals', data);
    return res.data;
  },
  async update(id: string, payload: Partial<{ amount: number; description?: string; method?: string }>) {
    const res = await getAxios.patch<{ success: boolean }>(`/withdrawals/${id}`, payload);
    return res.data;
  },
  async remove(id: string) {
    const res = await getAxios.delete<{ success: boolean }>(`/withdrawals/${id}`);
    return res.data;
  }
};

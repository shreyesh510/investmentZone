import getAxios from '../utils/interceptor/axiosInterceptor';

export interface WalletDto {
  id: string;
  name: string;
  platform?: string;
  balance?: number;
  currency?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletHistoryItem {
  id: string;
  userId: string;
  walletId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: string;
}

export const walletsApi = {
  list: async (): Promise<WalletDto[]> => {
    const res = await getAxios.get('/wallets');
    return res.data;
  },
  create: async (data: Partial<WalletDto> & { name: string }): Promise<WalletDto> => {
    const res = await getAxios.post('/wallets', data);
    return res.data;
  },
  async update(id: string, payload: Partial<WalletDto>) {
    const res = await getAxios.patch<{ success: boolean }>(`/wallets/${id}`, payload);
    return res.data;
  },
  async remove(id: string) {
    const res = await getAxios.delete<{ success: boolean }>(`/wallets/${id}`);
    return res.data;
  },
  async history(limit?: number) {
    const qs = typeof limit === 'number' ? `?limit=${limit}` : '';
    const res = await getAxios.get<WalletHistoryItem[]>(`/wallets/history/all${qs}`);
    return res.data;
  }
};

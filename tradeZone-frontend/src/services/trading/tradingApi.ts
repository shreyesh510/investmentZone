import axios from 'axios';
import type { TradingPnL, TradingWallet, DailySummary, WalletBalance } from '../../types/trading';

const API_BASE_URL = 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Trading P&L APIs
export const tradingPnLApi = {
  create: async (data: Omit<TradingPnL, 'id' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>): Promise<TradingPnL> => {
    const response = await axios.post(`${API_BASE_URL}/trading/pnl`, data, getAuthHeaders());
    return response.data;
  },

  getAll: async (date?: string): Promise<TradingPnL[]> => {
    const url = date ? `${API_BASE_URL}/trading/pnl?date=${date}` : `${API_BASE_URL}/trading/pnl`;
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
  },

  update: async (id: string, data: Partial<TradingPnL>): Promise<boolean> => {
    const response = await axios.patch(`${API_BASE_URL}/trading/pnl/${id}`, data, getAuthHeaders());
    return response.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await axios.delete(`${API_BASE_URL}/trading/pnl/${id}`, getAuthHeaders());
    return response.data;
  },

  getDailySummary: async (date: string): Promise<DailySummary> => {
    const response = await axios.get(`${API_BASE_URL}/trading/pnl/summary/daily?date=${date}`, getAuthHeaders());
    return response.data;
  },

  getHistory: async (limit?: number): Promise<any[]> => {
    const url = limit ? `${API_BASE_URL}/trading/pnl/history?limit=${limit}` : `${API_BASE_URL}/trading/pnl/history`;
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
  },
};

// Trading Wallet APIs
export const tradingWalletApi = {
  create: async (data: Omit<TradingWallet, 'id' | 'createdAt' | 'updatedAt'>): Promise<TradingWallet> => {
    const response = await axios.post(`${API_BASE_URL}/trading/wallet`, data, getAuthHeaders());
    return response.data;
  },

  getAll: async (): Promise<TradingWallet[]> => {
    const response = await axios.get(`${API_BASE_URL}/trading/wallet`, getAuthHeaders());
    return response.data;
  },

  update: async (id: string, data: Partial<TradingWallet>): Promise<boolean> => {
    const response = await axios.patch(`${API_BASE_URL}/trading/wallet/${id}`, data, getAuthHeaders());
    return response.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await axios.delete(`${API_BASE_URL}/trading/wallet/${id}`, getAuthHeaders());
    return response.data;
  },

  getTotalBalance: async (): Promise<WalletBalance> => {
    const response = await axios.get(`${API_BASE_URL}/trading/wallet/balance`, getAuthHeaders());
    return response.data;
  },

  getHistory: async (limit?: number): Promise<any[]> => {
    const url = limit ? `${API_BASE_URL}/trading/wallet/history?limit=${limit}` : `${API_BASE_URL}/trading/wallet/history`;
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
  },
};

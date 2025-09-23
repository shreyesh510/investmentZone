import getAxios from '../utils/interceptor/axiosInterceptor';

export interface TradeRuleDto {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'loss' | 'profit' | 'rule';
  importance: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
  violations: number;
  lastViolation: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTradeRuleDto {
  title: string;
  description: string;
  category: 'loss' | 'profit' | 'rule';
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface UpdateTradeRuleDto {
  title?: string;
  description?: string;
  category?: 'loss' | 'profit' | 'rule';
  importance?: 'critical' | 'high' | 'medium' | 'low';
  isActive?: boolean;
}

export interface ViolationAnalysis {
  totalViolations: number;
  totalRules: number;
  activeRules: number;
  violatedRules: number;
  averageViolationsPerRule: number;
  mostViolatedRule: {
    id: string;
    title: string;
    violations: number;
  } | null;
  categoryBreakdown: {
    [category: string]: {
      rules: number;
      violations: number;
    };
  };
  dailyViolations: {
    date: string;
    violations: number;
  }[];
  recentViolations: {
    ruleId: string;
    ruleTitle: string;
    violationDate: Date;
  }[];
}

export const tradeRulesApi = {
  list: async (filters?: {
    category?: string;
    isActive?: boolean;
    importance?: string;
  }): Promise<TradeRuleDto[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.importance) params.append('importance', filters.importance);

    const url = `/trade-rules${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await getAxios.get(url);
    return res.data;
  },

  create: async (data: CreateTradeRuleDto): Promise<TradeRuleDto> => {
    const res = await getAxios.post('/trade-rules', data);
    return res.data;
  },

  update: async (id: string, payload: UpdateTradeRuleDto) => {
    const res = await getAxios.patch<{ success: boolean }>(`/trade-rules/${id}`, payload);
    return res.data;
  },

  remove: async (id: string) => {
    const res = await getAxios.delete<{ success: boolean }>(`/trade-rules/${id}`);
    return res.data;
  },

  getById: async (id: string): Promise<TradeRuleDto> => {
    const res = await getAxios.get(`/trade-rules/${id}`);
    return res.data;
  },

  recordViolation: async (id: string): Promise<TradeRuleDto> => {
    const res = await getAxios.post(`/trade-rules/${id}/violation`);
    return res.data;
  },

  getViolationAnalysis: async (): Promise<ViolationAnalysis> => {
    const res = await getAxios.get('/trade-rules/violations');
    return res.data;
  },

  getHistory: async (): Promise<any[]> => {
    const res = await getAxios.get('/trade-rules/history');
    return res.data;
  },

  getPnlLimits: async (): Promise<{ lossAmount: number; profitAmount: number }> => {
    const res = await getAxios.get('/trade-rules/pnl-limits');
    return res.data;
  },

  updatePnlLimits: async (pnlLimits: { lossAmount?: number; profitAmount?: number }) => {
    const res = await getAxios.post('/trade-rules/pnl-limits', pnlLimits);
    return res.data;
  },
};
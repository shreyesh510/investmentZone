import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';

interface FinancialSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  totalProfit: number;
  totalLoss: number;
  totalNetProfit: number;
  netCashFlow: number;
}

interface FinancialSummaryCardsProps {
  isDarkMode: boolean;
}

const FinancialSummaryCards = ({ isDarkMode }: FinancialSummaryCardsProps) => {
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/dashboard/financial-summary', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch financial data');
        }

        const data = await response.json();
        setFinancialData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching financial data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [token]);

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMetricColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-300';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl backdrop-blur-lg border animate-pulse ${
              isDarkMode
                ? 'bg-gray-700/50 border-gray-600/50'
                : 'bg-white/80 border-gray-200/50'
            }`}
          >
            <div className="h-4 bg-gray-600 rounded mb-2"></div>
            <div className="h-8 bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-2">⚠️</div>
        <p className="text-red-400">Error loading financial data: {error}</p>
      </div>
    );
  }

  if (!financialData) {
    return null;
  }

  const metrics: Array<{
    label: string;
    value: number;
    color: string;
    bgColor: string;
    icon: string;
    description: string;
    currency?: string;
  }> = [
    {
      label: 'Total Deposits',
      value: financialData.totalDeposits,
      color: 'text-blue-400',
      bgColor: 'from-blue-500 to-cyan-500',
      icon: '📈',
      description: 'All completed deposits'
    },
    {
      label: 'Total Withdrawals',
      value: financialData.totalWithdrawals,
      color: 'text-orange-400',
      bgColor: 'from-orange-500 to-red-500',
      icon: '📉',
      description: 'All completed withdrawals'
    },
    {
      label: 'Total Profit',
      value: financialData.totalProfit,
      color: 'text-green-400',
      bgColor: 'from-green-500 to-emerald-500',
      icon: '💰',
      description: 'All trading profits',
      currency: 'INR'
    },
    {
      label: 'Total Loss',
      value: financialData.totalLoss,
      color: 'text-red-400',
      bgColor: 'from-red-500 to-pink-500',
      icon: '📉',
      description: 'All trading losses',
      currency: 'INR'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`p-6 rounded-xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${
            isDarkMode
              ? 'bg-gray-700/50 border-gray-600/50 hover:border-gray-500/70'
              : 'bg-white/80 border-gray-200/50 hover:border-gray-300/80'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {metric.label}
            </h3>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${metric.bgColor} flex items-center justify-center`}>
              <span className="text-lg">{metric.icon}</span>
            </div>
          </div>

          <div className="mb-2">
            <p className={`text-2xl font-bold ${metric.color}`}>
              {formatCurrency(metric.value, metric.currency || 'INR')}
            </p>
          </div>

          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {metric.description}
          </p>
        </div>
      ))}
    </div>
  );
};

export default FinancialSummaryCards;
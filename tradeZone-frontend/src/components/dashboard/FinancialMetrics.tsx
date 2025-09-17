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

const FinancialMetrics = () => {
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
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-4">Financial Overview</h2>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-4">Financial Overview</h2>
        <div className="text-red-400 text-center py-4">
          Error loading financial data: {error}
        </div>
      </div>
    );
  }

  if (!financialData) {
    return null;
  }

  const metrics = [
    {
      label: 'Total Deposits',
      value: financialData.totalDeposits,
      color: 'text-blue-400',
      icon: '↗️'
    },
    {
      label: 'Total Withdrawals',
      value: financialData.totalWithdrawals,
      color: 'text-orange-400',
      icon: '↙️'
    },
    {
      label: 'Total Profit',
      value: financialData.totalProfit,
      color: 'text-green-400',
      icon: '📈'
    },
    {
      label: 'Total Loss',
      value: financialData.totalLoss,
      color: 'text-red-400',
      icon: '📉'
    },
    {
      label: 'Net Profit',
      value: financialData.totalNetProfit,
      color: getMetricColor(financialData.totalNetProfit),
      icon: '💰'
    }
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold text-white mb-4">Financial Overview</h2>
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{metric.icon}</span>
              <span className="text-sm text-gray-300">{metric.label}</span>
            </div>
            <span className={`text-lg font-semibold ${metric.color}`}>
              {formatCurrency(metric.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Net Cash Flow as additional info */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-lg">🏦</span>
            <span className="text-sm text-gray-300">Net Cash Flow</span>
          </div>
          <span className={`text-lg font-semibold ${getMetricColor(financialData.netCashFlow)}`}>
            {formatCurrency(financialData.netCashFlow)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FinancialMetrics;
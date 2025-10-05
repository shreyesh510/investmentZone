import { memo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePageTitle, PAGE_TITLES } from '../../hooks/usePageTitle';
import { useSettings } from '../../contexts/settingsContext';
import type { RootState, AppDispatch } from '../../redux/store';
import { newDashboardApi } from '../../services/dashboardApiNew';
import RoundedButton from '../../components/button/RoundedButton';

type TimeFilter = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const Dashboard = memo(function Dashboard() {
  usePageTitle(PAGE_TITLES.DASHBOARD);
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSettings();
  const isDarkMode = settings.theme === 'dark';

  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1M');
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const timeframeMap: Record<TimeFilter, string> = {
        '1D': '1D',
        '1W': '1W',
        '1M': '1M',
        '3M': '3M',
        '6M': '6M',
        '1Y': '1Y',
        'ALL': 'ALL'
      };

      const data = await newDashboardApi.getConsolidatedDashboard(timeframeMap[selectedTimeFilter]);
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeFilter]);

  // Format currency with both INR and USD
  const formatCurrencyWithUSD = (amount: number) => {
    const usdAmount = (amount / 89).toFixed(2);
    return {
      inr: `₹${amount.toLocaleString()}`,
      usd: `$${usdAmount}`
    };
  };

  // Calculate totals from dashboard data
  const calculateTotals = () => {
    if (!dashboardData || !dashboardData.financialByTimeframe) {
      return {
        deposits: 0,
        withdrawals: 0,
        profit: 0,
        loss: 0,
        netAmount: 0
      };
    }

    const timeframeData = dashboardData.financialByTimeframe[selectedTimeFilter];
    if (!timeframeData) {
      return {
        deposits: 0,
        withdrawals: 0,
        profit: 0,
        loss: 0,
        netAmount: 0
      };
    }

    const deposits = timeframeData.deposits?.total || 0;
    const withdrawals = timeframeData.withdrawals?.total || 0;
    const profit = timeframeData.tradePnL?.totalProfit || 0;
    const loss = Math.abs(timeframeData.tradePnL?.totalLoss || 0);
    const netAmount = deposits - withdrawals;

    return {
      deposits,
      withdrawals,
      profit: profit * 89, // Convert to INR
      loss: loss * 89, // Convert to INR
      netAmount
    };
  };

  const totals = calculateTotals();

  // Loading state
  if (loading) {
    return (
      <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Error Loading Dashboard
          </h2>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col p-6`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
          Dashboard Overview
        </h1>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Real-time portfolio insights and performance analytics
        </p>
      </div>

      {/* Time Filter Buttons & Refresh */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as TimeFilter[]).map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedTimeFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTimeFilter === filter
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <RoundedButton
            onClick={fetchDashboardData}
            variant="purple"
            size="md"
            isDarkMode={isDarkMode}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Refresh
          </RoundedButton>
        </div>
      </div>

      {/* Performance Metrics with Circular Chart */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Performance Metrics ({selectedTimeFilter})
        </h3>

        {/* Unified Circular Progress Chart */}
        <div className="flex flex-col items-center mb-6">
          {/* Multi-segment Circular Chart */}
          <div className="relative w-64 h-64 mb-6">
            <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 42 42">
              {/* Background Circle */}
              <circle cx="21" cy="21" r="15.915" fill="none" stroke={isDarkMode ? '#374151' : '#e5e7eb'} strokeWidth="3"/>

              {(() => {
                const totalAmount = totals.deposits + totals.withdrawals + totals.profit + totals.loss;
                if (totalAmount === 0) return null;

                const depositPercent = (totals.deposits / totalAmount) * 100;
                const withdrawalPercent = (totals.withdrawals / totalAmount) * 100;
                const profitPercent = (totals.profit / totalAmount) * 100;
                const lossPercent = (totals.loss / totalAmount) * 100;

                let currentOffset = 0;

                return (
                  <>
                    {/* Deposits Segment */}
                    <circle
                      cx="21" cy="21" r="15.915"
                      fill="none"
                      stroke={hoveredSegment === 'deposits' ? '#1d4ed8' : '#3b82f6'}
                      strokeWidth={hoveredSegment === 'deposits' ? "4" : "3"}
                      strokeDasharray={`${depositPercent} 100`}
                      strokeDashoffset={-currentOffset}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredSegment('deposits')}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                    {/* Withdrawals Segment */}
                    <circle
                      cx="21" cy="21" r="15.915"
                      fill="none"
                      stroke={hoveredSegment === 'withdrawals' ? '#ea580c' : '#f97316'}
                      strokeWidth={hoveredSegment === 'withdrawals' ? "4" : "3"}
                      strokeDasharray={`${withdrawalPercent} 100`}
                      strokeDashoffset={-(currentOffset += depositPercent)}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredSegment('withdrawals')}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                    {/* Profit Segment */}
                    <circle
                      cx="21" cy="21" r="15.915"
                      fill="none"
                      stroke={hoveredSegment === 'profit' ? '#047857' : '#10b981'}
                      strokeWidth={hoveredSegment === 'profit' ? "4" : "3"}
                      strokeDasharray={`${profitPercent} 100`}
                      strokeDashoffset={-(currentOffset += withdrawalPercent)}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredSegment('profit')}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                    {/* Loss Segment */}
                    <circle
                      cx="21" cy="21" r="15.915"
                      fill="none"
                      stroke={hoveredSegment === 'loss' ? '#dc2626' : '#ef4444'}
                      strokeWidth={hoveredSegment === 'loss' ? "4" : "3"}
                      strokeDasharray={`${lossPercent} 100`}
                      strokeDashoffset={-(currentOffset += profitPercent)}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredSegment('loss')}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  </>
                );
              })()}
            </svg>

            {/* Center Content - Dynamic based on hover */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {hoveredSegment ? (
                <>
                  <span className={`text-lg font-bold ${
                    hoveredSegment === 'deposits' ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') :
                    hoveredSegment === 'withdrawals' ? (isDarkMode ? 'text-orange-400' : 'text-orange-600') :
                    hoveredSegment === 'profit' ? (isDarkMode ? 'text-green-400' : 'text-green-600') :
                    (isDarkMode ? 'text-red-400' : 'text-red-600')
                  }`}>
                    {hoveredSegment === 'deposits' ? formatCurrencyWithUSD(totals.deposits).inr :
                     hoveredSegment === 'withdrawals' ? formatCurrencyWithUSD(totals.withdrawals).inr :
                     hoveredSegment === 'profit' ? formatCurrencyWithUSD(totals.profit).inr :
                     formatCurrencyWithUSD(totals.loss).inr}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    {hoveredSegment === 'deposits' ? formatCurrencyWithUSD(totals.deposits).usd :
                     hoveredSegment === 'withdrawals' ? formatCurrencyWithUSD(totals.withdrawals).usd :
                     hoveredSegment === 'profit' ? formatCurrencyWithUSD(totals.profit).usd :
                     formatCurrencyWithUSD(totals.loss).usd}
                  </span>
                  <span className={`text-sm font-medium ${
                    hoveredSegment === 'deposits' ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') :
                    hoveredSegment === 'withdrawals' ? (isDarkMode ? 'text-orange-400' : 'text-orange-600') :
                    hoveredSegment === 'profit' ? (isDarkMode ? 'text-green-400' : 'text-green-600') :
                    (isDarkMode ? 'text-red-400' : 'text-red-600')
                  }`}>
                    {hoveredSegment.charAt(0).toUpperCase() + hoveredSegment.slice(1)}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {(() => {
                      const totalAmount = totals.deposits + totals.withdrawals + totals.profit + totals.loss;
                      const amount = hoveredSegment === 'deposits' ? totals.deposits :
                                   hoveredSegment === 'withdrawals' ? totals.withdrawals :
                                   hoveredSegment === 'profit' ? totals.profit :
                                   totals.loss;
                      return totalAmount > 0 ? `${((amount / totalAmount) * 100).toFixed(1)}% of total` : '0.0% of total';
                    })()}
                  </span>
                </>
              ) : (
                <>
                  <span className={`text-lg font-bold ${
                    totals.netAmount >= 0
                      ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                      : (isDarkMode ? 'text-green-400' : 'text-green-600')
                  }`}>
                    {totals.netAmount >= 0 ? '-' : '+'}{formatCurrencyWithUSD(Math.abs(totals.netAmount)).inr}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    {totals.netAmount >= 0 ? '-' : '+'}{formatCurrencyWithUSD(Math.abs(totals.netAmount)).usd}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                    Net Amount
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Deposits */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Deposits</p>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} truncate`}>
                  {formatCurrencyWithUSD(totals.deposits).inr}
                </p>
              </div>
            </div>

            {/* Withdrawals */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Withdrawals</p>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-orange-400' : 'text-orange-600'} truncate`}>
                  {formatCurrencyWithUSD(totals.withdrawals).inr}
                </p>
              </div>
            </div>

            {/* Profit */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Profit</p>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'} truncate`}>
                  {formatCurrencyWithUSD(totals.profit).inr}
                </p>
              </div>
            </div>

            {/* Loss */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loss</p>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'} truncate`}>
                  {formatCurrencyWithUSD(totals.loss).inr}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;



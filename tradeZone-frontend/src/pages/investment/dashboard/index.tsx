import { memo, useState, useEffect } from 'react';
import { useSettings } from '../../../contexts/settingsContext';
import { newDashboardApi, type ConsolidatedDashboardResponse, type TimeframeFinancialData } from '../../../services/dashboardApiNew';

const InvestmentDashboard = memo(function InvestmentDashboard() {
  const { settings } = useSettings();
  const isDarkMode = settings.theme === 'dark';

  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1M');
  const [dashboardData, setDashboardData] = useState<ConsolidatedDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Timeframe options mapped to API timeframes
  const timeframeOptions = [
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' }
  ];

  // Fetch dashboard data
  const fetchDashboardData = async (timeframe: string) => {
    try {
      setLoading(true);
      setError(null);
      // Use CUSTOM timeframe if date filters are provided
      const effectiveTimeframe = (startDate || endDate) ? 'CUSTOM' : timeframe;
      const data = await newDashboardApi.getConsolidatedDashboard(
        effectiveTimeframe,
        new Date().getFullYear(),
        startDate || undefined,
        endDate || undefined
      );
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data only on mount
  useEffect(() => {
    fetchDashboardData(selectedTimeframe);
  }, []);

  // Get current timeframe data - use CUSTOM if date filters are active
  const activeTimeframe = (startDate || endDate) ? 'CUSTOM' : selectedTimeframe;
  const currentTimeframeData: TimeframeFinancialData | null = dashboardData?.financialByTimeframe?.[activeTimeframe] || null;

  // Calculate totals from current timeframe data
  const calculateDepositTotal = () => {
    return currentTimeframeData?.deposits?.total || 0;
  };

  const calculateWithdrawalTotal = () => {
    return currentTimeframeData?.withdrawals?.total || 0;
  };

  const calculateNetAmount = () => {
    const totalWithdrawals = calculateWithdrawalTotal();
    const totalDeposits = calculateDepositTotal();
    return totalDeposits - totalWithdrawals;
  };

  // Get trade PnL totals
  const getTradePnLTotals = () => {
    const tradePnL = currentTimeframeData?.tradePnL;
    return {
      profit: tradePnL?.totalProfit || 0,
      loss: Math.abs(tradePnL?.totalLoss || 0),
      netPnL: tradePnL?.netPnL || 0,
      trades: tradePnL?.totalTrades || 0,
      wins: tradePnL?.winningTrades || 0,
      losses: tradePnL?.losingTrades || 0,
    };
  };

  const totals = getTradePnLTotals();

  // Format currency with both INR and USD
  const formatCurrencyWithUSD = (amount: number) => {
    const usdAmount = (amount / 89).toFixed(2);
    return {
      inr: `₹${amount.toLocaleString()}`,
      usd: `$${usdAmount}`
    };
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className={`ml-4 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Investment Dashboard
          </h1>

          {/* Filters Section */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} mb-6`}>
            {/* Timeframe Selector */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Timeframe:
              </span>
              <div className="flex gap-2">
                {timeframeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedTimeframe(option.value);
                      // Clear date filters when selecting a timeframe
                      setStartDate('');
                      setEndDate('');
                    }}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedTimeframe === option.value && !startDate && !endDate
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Date Range:
              </span>
              <div className="flex items-center gap-2">
                <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Start Date:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
                      : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  End Date:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
                      : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Clear Dates
                </button>
              )}
            </div>

            {/* Apply Filter Button */}
            <div className="flex gap-2">
              <button
                onClick={() => fetchDashboardData(selectedTimeframe)}
                disabled={loading}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                  loading
                    ? isDarkMode
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {loading ? 'Loading...' : 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 border border-red-300">
            <p className="text-red-700">Error loading dashboard data: {error}</p>
          </div>
        )}

        {/* Performance Metrics */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Performance Metrics ({activeTimeframe})
            </h3>
            {(startDate || endDate) && (
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {startDate && <span>From: {new Date(startDate).toLocaleDateString()}</span>}
                {startDate && endDate && <span className="mx-2">•</span>}
                {endDate && <span>To: {new Date(endDate).toLocaleDateString()}</span>}
              </div>
            )}
          </div>

          {/* Unified Circular Progress Chart */}
          <div className="flex flex-col items-center mb-6">
            {/* Multi-segment Circular Chart */}
            <div className="relative w-64 h-64 mb-6">
              <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 42 42">
                {/* Background Circle */}
                <circle cx="21" cy="21" r="15.915" fill="none" stroke={isDarkMode ? '#374151' : '#e5e7eb'} strokeWidth="3"/>

                {(() => {
                  const totalAmount = calculateDepositTotal() + calculateWithdrawalTotal();
                  if (totalAmount === 0) return null;

                  const depositPercent = (calculateDepositTotal() / totalAmount) * 100;
                  const withdrawalPercent = (calculateWithdrawalTotal() / totalAmount) * 100;

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
                      (isDarkMode ? 'text-orange-400' : 'text-orange-600')
                    }`}>
                      {hoveredSegment === 'deposits' ? formatCurrencyWithUSD(calculateDepositTotal()).inr :
                       formatCurrencyWithUSD(calculateWithdrawalTotal()).inr}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      {hoveredSegment === 'deposits' ? formatCurrencyWithUSD(calculateDepositTotal()).usd :
                       formatCurrencyWithUSD(calculateWithdrawalTotal()).usd}
                    </span>
                    <span className={`text-sm font-medium ${
                      hoveredSegment === 'deposits' ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') :
                      (isDarkMode ? 'text-orange-400' : 'text-orange-600')
                    }`}>
                      {hoveredSegment.charAt(0).toUpperCase() + hoveredSegment.slice(1)}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {(() => {
                        const totalAmount = calculateDepositTotal() + calculateWithdrawalTotal();
                        const amount = hoveredSegment === 'deposits' ? calculateDepositTotal() :
                                     calculateWithdrawalTotal();
                        return `${((amount / totalAmount) * 100).toFixed(1)}% of total`;
                      })()}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={`text-lg font-bold ${
                      calculateNetAmount() >= 0
                        ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                        : (isDarkMode ? 'text-green-400' : 'text-green-600')
                    }`}>
                      {calculateNetAmount() >= 0 ? '-' : '+'}{formatCurrencyWithUSD(Math.abs(calculateNetAmount())).inr}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      {calculateNetAmount() >= 0 ? '-' : '+'}{formatCurrencyWithUSD(Math.abs(calculateNetAmount())).usd}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                      Net Amount
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {/* Deposits */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Deposits</p>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} truncate`}>
                    {formatCurrencyWithUSD(calculateDepositTotal()).inr}
                  </p>
                </div>
              </div>

              {/* Withdrawals */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Withdrawals</p>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-orange-400' : 'text-orange-600'} truncate`}>
                    {formatCurrencyWithUSD(calculateWithdrawalTotal()).inr}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

export default InvestmentDashboard;
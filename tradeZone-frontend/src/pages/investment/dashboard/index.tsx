import { memo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RoundedButton from '../../../components/button/RoundedButton';
import { useSettings } from '../../../contexts/settingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../../redux/store';
import { fetchUnifiedDashboard } from '../../../redux/thunks/dashboard/dashboardThunks';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

type TimeFilter = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

// ---- Chart Helper Types & Utilities ----
interface TimeSeriesPoint { period: string; value: number }
interface PositionedPoint extends TimeSeriesPoint { x: number; y: number; label: string }
interface TradePnLPoint { period: string; netPnL: number }
interface WithdrawalPoint { period: string; totalAmount: number; count: number; completedCount?: number; pendingCount?: number }

const safeNumber = (v: unknown, fallback = 0): number => (typeof v === 'number' && isFinite(v) ? v : fallback);

function buildLinearPoints(
  raw: TimeSeriesPoint[],
  width: number,
  height: number,
  padding: number,
  formatLabel: (p: TimeSeriesPoint) => string,
): PositionedPoint[] {
  if (!raw.length) return [];
  const values = raw.map(p => safeNumber(p.value));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const denom = max - min === 0 ? 1 : max - min;
  const base = (raw.length - 1) || 1;
  return raw.map((p, idx) => {
    const value = safeNumber(p.value, min);
    const normalized = (value - min) / denom; // 0..1
    const x = padding + (idx * (width - 2 * padding)) / base;
    const y = height - padding - normalized * (height - 2 * padding);
    return { ...p, x, y, label: formatLabel(p) };
  });
}

const InvestmentDashboard = memo(function InvestmentDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();

  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1M');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Redux state - simplified unified dashboard
  const { data: unifiedData, loading, error } = useSelector((state: RootState) => state.dashboard);

  // Debug logging
  console.log('🔍 InvestmentDashboard render - Redux state:', {
    data: unifiedData,
    loading,
    error,
    hasData: !!unifiedData
  });

  // Fetch unified dashboard data
  useEffect(() => {
    console.log('🚀 InvestmentDashboard: useEffect triggered, dispatching fetchUnifiedDashboard');
    dispatch(fetchUnifiedDashboard());
  }, [dispatch]);



  // Navigate to investment page if user doesn't have access
  useEffect(() => {
    if (!canAccessInvestment) {
      navigate('/investment');
    }
  }, [canAccessInvestment, navigate]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if we need to fetch data (only fetch once, use cached data for timeframe switching)
  const hasData = useSelector((state: RootState) => {
    const { positions, tradePnL, transactions } = state.newDashboard;
    return !!(positions && tradePnL && transactions);
  });

  const lastUpdated = useSelector((state: RootState) => state.newDashboard.lastUpdated);
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes
  const isCacheValid = lastUpdated && (Date.now() - lastUpdated) < cacheTimeout;

  // Fetch dashboard data only once or when cache expires
  useEffect(() => {
    if (!hasData || !isCacheValid) {
      console.log('🔄 Fetching dashboard data (cache invalid or no data)');
      // Fetch all dashboard data with ALL timeframes at once
      dispatch(fetchAllDashboardData('ALL'));

      // Fallback: also fetch old dashboard data for now
      dispatch(fetchDashboardSummary(365)); // Get 1 year of data
    } else {
      console.log('✅ Using cached dashboard data');
    }
  }, [dispatch, hasData, isCacheValid]);

  // Update timeframe in Redux when user changes it (no API call needed)
  useEffect(() => {
    dispatch(setTimeframe(selectedTimeFilter));
  }, [dispatch, selectedTimeFilter]);

  // Fetch deposits, withdrawals, and tradePnL
  useEffect(() => {
    dispatch(fetchDeposits());
    dispatch(fetchWithdrawals());
    dispatch(fetchTradePnL());
  }, [dispatch]);


  const isDarkMode = settings.theme === 'dark';

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format currency with both INR and USD (exact copy from Trade P&L)
  const formatCurrencyWithUSD = (amount: number) => {
    const usdAmount = (amount / 89).toFixed(2);
    return {
      inr: `₹${amount.toLocaleString()}`,
      usd: `$${usdAmount}`
    };
  };

  // Calculate deposit total (simplified)
  const calculateDepositTotal = () => {
    return unifiedData?.totalDeposits || 0;
  };

  // Calculate withdrawal total (simplified)
  const calculateWithdrawalTotal = () => {
    return unifiedData?.totalWithdrawals || 0;
  };

  // Calculate net amount (deposits - withdrawals) = investment/loss
  const calculateNetAmount = () => {
    const totalWithdrawals = calculateWithdrawalTotal();
    const totalDeposits = calculateDepositTotal();
    return totalDeposits - totalWithdrawals;
  };

  // Generate combined deposit & withdrawal chart data
  const generateCombinedChartData = (timeFilter: TimeFilter) => {
    const startDate = new Date('2025-09-09');
    const now = new Date();
    const dataPoints: { date: string; deposits: number; withdrawals: number; net: number }[] = [];

    // Calculate days from start date to now
    const totalDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    let days = 30;
    let cutoffDate = new Date(startDate);

    switch (timeFilter) {
      case '1D':
        days = 1;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case '1W':
        days = 7;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case '1M':
        days = 30;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      case '3M':
        days = 90;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        break;
      case '6M':
        days = 180;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 180);
        break;
      case '1Y':
        days = 365;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 365);
        break;
      case 'ALL':
        days = totalDays;
        cutoffDate = new Date(startDate);
        break;
    }

    // Make sure cutoff date is not before start date
    if (cutoffDate < startDate) {
      cutoffDate = new Date(startDate);
      days = totalDays;
    }

    // Filter deposits and withdrawals within the selected time period
    const filteredDeposits = deposits.filter(d => {
      const depositDate = new Date((d as any).requestedAt || (d as any).depositedAt);
      return depositDate >= cutoffDate && depositDate <= now;
    });

    const filteredWithdrawals = withdrawals.filter(w => {
      const withdrawalDate = new Date(w.requestedAt || w.completedAt || '');
      return withdrawalDate >= cutoffDate && withdrawalDate <= now;
    });

    // Generate test data for demonstration if no real data exists
    const hasRealData = filteredDeposits.length > 0 || filteredWithdrawals.length > 0;

    // Always show every day from start date to today (or within the selected timeframe)
    const iterationStartDate = new Date(Math.max(cutoffDate.getTime(), startDate.getTime()));
    const daysBetween = Math.floor((now.getTime() - iterationStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // Create maps for efficient lookup
    const depositsByDate = new Map<string, number>();
    const withdrawalsByDate = new Map<string, number>();

    if (hasRealData) {
      // Map deposits by date
      filteredDeposits.forEach(deposit => {
        const depositDate = new Date((deposit as any).requestedAt || (deposit as any).depositedAt).toISOString().split('T')[0];
        const currentTotal = depositsByDate.get(depositDate) || 0;
        depositsByDate.set(depositDate, currentTotal + deposit.amount);
      });

      // Map withdrawals by date
      filteredWithdrawals.forEach(withdrawal => {
        const withdrawalDate = new Date(withdrawal.requestedAt || withdrawal.completedAt || '').toISOString().split('T')[0];
        const currentTotal = withdrawalsByDate.get(withdrawalDate) || 0;
        withdrawalsByDate.set(withdrawalDate, currentTotal + (withdrawal.amount || 0));
      });
    }

    // Generate data points for every single day
    for (let i = 0; i <= daysBetween; i++) {
      const date = new Date(iterationStartDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      let depositAmount = 0;
      let withdrawalAmount = 0;

      if (hasRealData) {
        // Use actual data - will be 0 if no transactions on this day
        depositAmount = depositsByDate.get(dateStr) || 0;
        withdrawalAmount = withdrawalsByDate.get(dateStr) || 0;
      } else {
        // Generate test data for demonstration
        const random = Math.random();
        const dateProgress = i / Math.max(daysBetween, 1);

        // Create more realistic patterns with trends
        if (random > 0.7) { // 30% chance of deposit
          depositAmount = Math.floor((Math.random() * 30000 + 20000) * (1 + dateProgress * 0.5));
        }
        if (random > 0.8) { // 20% chance of withdrawal
          withdrawalAmount = Math.floor((Math.random() * 25000 + 10000) * (1 + dateProgress * 0.3));
        }
        // Otherwise amounts remain 0 (no transactions that day)
      }

      dataPoints.push({
        date: dateStr,
        deposits: depositAmount,
        withdrawals: withdrawalAmount,
        net: depositAmount - withdrawalAmount
      });
    }

    return dataPoints;
  };

  const combinedChartData = generateCombinedChartData(selectedTimeFilter);

  // Generate PnL (Profit and Loss) data
  const generatePnLData = (timeFilter: TimeFilter) => {
    const startDate = new Date('2025-09-09');
    const now = new Date();
    const dataPoints: { date: string; pnl: number; cumulative: number }[] = [];

    // Calculate days from start date to now
    const totalDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    let days = 30;
    let cutoffDate = new Date(startDate);

    switch (timeFilter) {
      case '1D':
        days = 1;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case '1W':
        days = 7;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case '1M':
        days = 30;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      case '3M':
        days = 90;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        break;
      case '6M':
        days = 180;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 180);
        break;
      case '1Y':
        days = 365;
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 365);
        break;
      case 'ALL':
        days = totalDays;
        cutoffDate = new Date(startDate);
        break;
    }

    // Make sure cutoff date is not before start date
    if (cutoffDate < startDate) {
      cutoffDate = new Date(startDate);
      days = totalDays;
    }

    let cumulativePnL = 0;
    const hasRealData = tradePnLItems.length > 0;

    // Always show every day from start date to today (or within the selected timeframe)
    const iterationStartDate = new Date(Math.max(cutoffDate.getTime(), startDate.getTime()));
    const daysBetween = Math.floor((now.getTime() - iterationStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // Create a map of trade data by date for efficient lookup
    const tradePnLByDate = new Map<string, number>();
    if (hasRealData) {
      tradePnLItems.forEach(trade => {
        const tradeDate = new Date(trade.date).toISOString().split('T')[0];
        const currentTotal = tradePnLByDate.get(tradeDate) || 0;
        tradePnLByDate.set(tradeDate, currentTotal + trade.netPnL);
      });
    }

    // Generate data points for every single day
    for (let i = 0; i <= daysBetween; i++) {
      const date = new Date(iterationStartDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      let dailyPnL = 0;

      if (hasRealData) {
        // Use actual tradePnL data - will be 0 if no trades on this day
        dailyPnL = tradePnLByDate.get(dateStr) || 0;
      } else {
        // Generate test PnL data (fallback when no real data)
        const random = Math.random();
        const dateProgress = i / Math.max(daysBetween, 1);

        if (random > 0.4) { // 60% chance of having trades on a day
          const baseVolatility = 15000;
          const trendFactor = dateProgress * 8000;
          const marketVolatility = Math.sin(i * 0.3) * 5000;

          dailyPnL = (Math.random() - 0.45) * baseVolatility + trendFactor / Math.max(daysBetween, 1) + marketVolatility;

          if (i % 7 < 3) {
            dailyPnL += Math.random() * 3000;
          } else if (i % 7 > 5) {
            dailyPnL -= Math.random() * 2000;
          }
        }
        // Otherwise dailyPnL remains 0 (no trades that day)
      }

      cumulativePnL += dailyPnL;

      dataPoints.push({
        date: dateStr,
        pnl: dailyPnL,
        cumulative: cumulativePnL
      });
    }

    return dataPoints;
  };

  const pnlData = generatePnLData(selectedTimeFilter);

  // Custom Tooltip for Combined Chart
  const CombinedChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
      return (
        <div className={`rounded-lg border p-4 shadow-lg ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-300 text-gray-900'
        }`}>
          <p className={`font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {entry.name}:
              </span>
              <span className={`font-bold text-sm ${
                entry.dataKey === 'deposits' ? 'text-green-500' :
                entry.dataKey === 'withdrawals' ? 'text-orange-500' :
                entry.value >= 0 ? 'text-blue-500' : 'text-red-500'
              }`}>
                {formatCurrency(Math.abs(entry.value), 'INR')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for PnL Chart
  const PnLTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
      return (
        <div className={`rounded-lg border p-4 shadow-lg ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-300 text-gray-900'
        }`}>
          <p className={`font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {entry.name}:
              </span>
              <span className={`font-bold text-sm ${
                entry.value >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {entry.value >= 0 ? '+' : ''}{formatCurrency(entry.value, 'INR')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

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
            onClick={() => dispatch(fetchUnifiedDashboard())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const content = (
    <div className={`flex-1 p-6 overflow-y-auto ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
          Portfolio Overview
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
            onClick={() => {
              console.log('🔄 Manually refreshing dashboard data');
              dispatch(fetchUnifiedDashboard());
            }}
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



      {/* Performance Metrics (Exact copy from Trade P&L) */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Performance Metrics
        </h3>

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
                      const amount = hoveredSegment === 'deposits' ? calculateDepositTotal() : calculateWithdrawalTotal();
                      return totalAmount > 0 ? `${((amount / totalAmount) * 100).toFixed(1)}% of total` : '0.0% of total';
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
          <div className="grid grid-cols-2 gap-4 w-full">
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
  );


  return (
    <div className={`h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col overflow-hidden`}>
      {content}
    </div>
  );
});

export default InvestmentDashboard;
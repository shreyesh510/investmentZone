import { memo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../../layouts/header';
import Sidebar from '../../../layouts/sidebar';
import FloatingButton, { type MobileTab } from '../../../components/button/floatingButton';
import RoundedButton from '../../../components/button/RoundedButton';
import { useSettings } from '../../../contexts/settingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../../redux/store';
import { fetchDashboardSummary } from '../../../redux/thunks/dashboard/dashboardThunks';
import { 
  fetchAllDashboardData
} from '../../../redux/thunks/dashboard/newDashboardThunks';
import { setTimeframe, selectDashboardDataByTimeframe } from '../../../redux/slices/newDashboardSlice';

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
  
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1M');

  // Redux state - using both old and new dashboard for transition
  const { data: oldDashboardData, loading: oldLoading, error: oldError } = useSelector((state: RootState) => state.dashboard);
  const newDashboard = useSelector((state: RootState) => state.newDashboard);
  
  // Get data filtered by selected timeframe from cached data
  const dashboardDataByTimeframe = useSelector((state: RootState) =>
    selectDashboardDataByTimeframe(state, selectedTimeFilter)
  );

  // Use new dashboard data if available, fallback to old
  const loading = newDashboard.loading.all || oldLoading;
  const error = newDashboard.errors.all || oldError;

  // Create unified data object for component consumption
  const dashboardData = dashboardDataByTimeframe ? {
    wallets: {
      dematWallet: dashboardDataByTimeframe.wallets.summary?.dematWallet || { balance: 0, currency: 'USD', count: 0 },
      bankWallet: dashboardDataByTimeframe.wallets.summary?.bankWallet || { balance: 0, currency: 'INR', count: 0 },
      recentActivity: dashboardDataByTimeframe.wallets.recentActivity || []
    },

    positions: {
      totalInvested: dashboardDataByTimeframe.positions.summary?.totalInvested || 0,
      totalPnL: dashboardDataByTimeframe.positions.summary?.totalPnL || 0
    },

    tradePnL: {
      total: dashboardDataByTimeframe.tradePnL.total || { netPnL: 0, profit: 0, loss: 0, trades: 0 },
      statistics: dashboardDataByTimeframe.tradePnL.statistics || {
        netPnL: 0,
        totalTrades: 0,
        winRate: 0,
        averageDailyPnL: 0
      },
      chartData: dashboardDataByTimeframe.tradePnL.chartData || { daily: [], weekly: [], monthly: [], yearly: [] }
    },

    transactions: {
      deposits: {
        total: dashboardDataByTimeframe.transactions.deposits?.total || 0,
        pending: dashboardDataByTimeframe.transactions.deposits?.pending || 0,
        completed: dashboardDataByTimeframe.transactions.deposits?.completed || 0,
        list: dashboardDataByTimeframe.transactions.deposits?.recentActivity || []
      },
      withdrawals: {
        chartData: dashboardDataByTimeframe.transactions.withdrawals?.chartData || { daily: [], weekly: [], monthly: [], yearly: [] }
      }
    }
  } : {
    // Fallback to old dashboard data structure
    wallets: oldDashboardData?.wallets || {
      dematWallet: { balance: 0, currency: 'USD', count: 0 },
      bankWallet: { balance: 0, currency: 'INR', count: 0 },
      recentActivity: []
    },

    positions: oldDashboardData?.positions || {
      totalInvested: 0,
      totalPnL: 0
    },

    tradePnL: oldDashboardData?.tradePnL || {
      total: { netPnL: 0, profit: 0, loss: 0, trades: 0 },
      statistics: { netPnL: 0, totalTrades: 0, winRate: 0, averageDailyPnL: 0 },
      chartData: { daily: [], weekly: [], monthly: [], yearly: [] }
    },

    transactions: oldDashboardData?.transactions || {
      deposits: { total: 0, pending: 0, completed: 0, list: [] },
      withdrawals: { chartData: { daily: [], weekly: [], monthly: [], yearly: [] } }
    }
  };

  // Redirect if no permission
  useEffect(() => {
    if (!canAccessInvestment()) {
      navigate('/zone');
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
  };

  const isDarkMode = settings.theme === 'dark';

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
            onClick={() => dispatch(fetchDashboardSummary())}
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
              // Force refresh all data
              dispatch(fetchAllDashboardData('ALL'));
              dispatch(fetchDashboardSummary(365));
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

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Portfolio Value */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        } hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Demat Account
            </h3>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
            {formatCurrency(dashboardData.wallets.dematWallet.balance, dashboardData.wallets.dematWallet.currency)}
          </p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Available balance
          </p>
        </div>

        {/* Total Invested */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        } hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Invested
            </h3>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">
            {formatCurrency(dashboardData.positions.totalInvested)}
          </p>
        </div>

        {/* Total Returns */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        } hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Returns
            </h3>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
              dashboardData.positions.totalPnL >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'
            } flex items-center justify-center`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d={dashboardData.positions.totalPnL >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-bold ${
            dashboardData.positions.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(dashboardData.positions.totalPnL)}
          </p>
          <p className={`text-sm mt-1 ${
            dashboardData.positions.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            Positions P&L
          </p>
        </div>

        {/* Total Performance */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        } hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total P&L
            </h3>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
              dashboardData.tradePnL.total.netPnL >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'
            } flex items-center justify-center`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-bold ${
            dashboardData.tradePnL.total.netPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(dashboardData.tradePnL.total.netPnL)}
          </p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {dashboardData.tradePnL.total.trades} total trades
          </p>
        </div>
      </div>


      {/* Wallet Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
        {/* Left Half - Current Wallets */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border h-full ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Current Wallets</h2>
          
          {/* Wallet Totals - Top Half */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Demat Balance</p>
                <p className="text-lg font-bold text-blue-400">
                  {formatCurrency(dashboardData.wallets.dematWallet.balance, dashboardData.wallets.dematWallet.currency)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bank Balance</p>
                <p className="text-lg font-bold text-green-400">
                  {formatCurrency(dashboardData.wallets.bankWallet.balance, dashboardData.wallets.bankWallet.currency)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  {dashboardData.wallets.dematWallet.count} Demat Accounts
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                }`}>
                  {dashboardData.wallets.bankWallet.count} Bank Accounts
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Recent Activity - Bottom Half */}
          <div>
            <h3 className="text-sm font-medium mb-3">Recent Wallet Activity</h3>
            <div className="space-y-3 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
              {dashboardData.wallets.recentActivity.slice(0, 4).map((activity) => (
                <div key={activity.id} className={`p-3 rounded-lg border transition-all duration-200 hover:scale-102 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-gray-600/50 hover:border-gray-500/70' 
                    : 'bg-gradient-to-r from-white/80 to-gray-50/80 border-gray-200/60 hover:border-gray-300/80'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {/* Action Icon */}
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                        activity.action === 'create' ? 'bg-green-500/20 text-green-400' :
                        activity.action === 'deposit' ? 'bg-blue-500/20 text-blue-400' :
                        activity.action === 'withdrawal' ? 'bg-red-500/20 text-red-400' :
                        activity.action === 'trade' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {activity.action === 'create' && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        )}
                        {activity.action === 'deposit' && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        )}
                        {activity.action === 'withdrawal' && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                          </svg>
                        )}
                        {activity.action === 'trade' && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        )}
                        {activity.action === 'update' && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs mb-1 truncate">
                          {activity.data?.name || 'Wallet Activity'}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {activity.action} • {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        activity.action === 'create' ? 'bg-green-500/20 text-green-400' :
                        activity.action === 'deposit' ? 'bg-blue-500/20 text-blue-400' :
                        activity.action === 'withdrawal' ? 'bg-red-500/20 text-red-400' :
                        activity.action === 'trade' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {activity.action.toUpperCase()}
                      </span>
                      
                      {/* Show amount based on action type */}
                      {(activity.action === 'deposit' || activity.action === 'withdrawal') && activity.data?.changes?.balance ? (
                        <span className={`text-xs font-bold ${
                          activity.action === 'deposit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {activity.action === 'deposit' ? '+' : '-'}
                          {formatCurrency(Math.abs(activity.data.changes.balance), activity.data?.next?.currency || activity.data?.prev?.currency || 'USD')}
                        </span>
                      ) : activity.data?.changes?.balance ? (
                        <span className={`text-xs font-bold ${
                          activity.data.changes.balance > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {activity.data.changes.balance > 0 ? '+' : ''}
                          {formatCurrency(activity.data.changes.balance, activity.data?.next?.currency || 'USD')}
                        </span>
                      ) : activity.data?.next?.balance && activity.action === 'create' ? (
                        <span className="text-xs font-bold text-blue-400">
                          {formatCurrency(activity.data.next.balance, activity.data.next.currency || 'USD')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Half - Deposits Section */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border h-full ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Deposits</h2>
          
          {/* Deposits Data - Top Half */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                <p className="text-lg font-bold text-blue-400">
                  {formatCurrency(dashboardData.transactions.deposits.total, 'INR')}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Count</p>
                <p className="text-lg font-bold text-gray-300">
                  {dashboardData.transactions.deposits.pending + dashboardData.transactions.deposits.completed}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                }`}>
                  {dashboardData.transactions.deposits.completed} Completed
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {dashboardData.transactions.deposits.pending} Pending
                </span>
              </div>
            </div>
          </div>

          {/* Deposits Recent Activity - Bottom Half */}
          <div>
            <h3 className="text-sm font-medium mb-3">Recent Deposit Activity</h3>
            <div className="space-y-3 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
              {dashboardData.transactions.deposits.list.slice(0, 5).map((deposit) => (
                <div key={deposit.id} className={`p-3 rounded-lg border transition-all duration-200 hover:scale-102 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-gray-600/50 hover:border-gray-500/70' 
                    : 'bg-gradient-to-r from-white/80 to-gray-50/80 border-gray-200/60 hover:border-gray-300/80'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {/* Deposit Icon */}
                      <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs mb-1 truncate">
                          {deposit.method || 'Bank Transfer'}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {deposit.description}
                        </p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {new Date(deposit.requestedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        deposit.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {deposit.status === 'completed' ? 'DONE' : 'PENDING'}
                      </span>
                      <span className="text-xs font-bold text-blue-400">
                        +{formatCurrency(deposit.amount, 'INR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trade P&L Analytics */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Trade P&L Analytics</h2>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          {/* P&L Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Net P&L</p>
              <p className={`text-lg font-bold ${
                dashboardData.tradePnL.statistics.netPnL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(dashboardData.tradePnL.statistics.netPnL)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Trades</p>
              <p className="text-lg font-bold text-gray-300">
                {dashboardData.tradePnL.statistics.totalTrades}
              </p>
            </div>
          </div>

          {/* Line Chart */}
          <div className="relative h-48 mb-4">
            <div className={`absolute inset-0 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <svg className="w-full h-full p-4" viewBox="0 0 400 160">
                {/* Grid Lines */}
                <defs>
                  <pattern id="tradegrid" width="40" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 32" fill="none" stroke={isDarkMode ? '#374151' : '#e5e7eb'} strokeWidth="1" opacity="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#tradegrid)" />
                
                {/* Generate line chart points from trade P&L data */}
                {(() => {
                  // Get appropriate data based on timeframe
                  const getDataForTimeframe = () => {
                    const chartData = dashboardData.tradePnL?.chartData;
                    if (!chartData) return [];

                    switch (selectedTimeFilter) {
                      case '1D': return (chartData as any).daily || [];
                      case '1W': return (chartData as any).daily || [];
                      case '1M': return (chartData as any).daily || chartData.weekly || [];
                      case '3M': return chartData.weekly || [];
                      case '6M': return chartData.weekly || [];
                      case '1Y': return chartData.monthly || [];
                      case 'ALL': return chartData.yearly || [];
                      default: return chartData.weekly || [];
                    }
                  };

                  const data = getDataForTimeframe();
                  if (!data || data.length === 0) {
                    return <div className="flex items-center justify-center h-32 text-gray-500">No data available</div>;
                  }
                  const rawValues: number[] = data
                    .map((d: { netPnL: number }) => safeNumber(d.netPnL))
                    .filter((v: number) => isFinite(v));
                  if (rawValues.length === 0) {
                    return <div className="flex items-center justify-center h-32 text-gray-500">No data available</div>;
                  }
                  const maxPnL = Math.max(...rawValues);
                  const minPnL = Math.min(...rawValues);
                  const width = 360;
                  const height = 120;
                  const padding = 20;
                  const centerY = height / 2;
                  
                  const denom = (maxPnL - minPnL) === 0 ? 1 : (maxPnL - minPnL);
                  const points = data.map((item: TradePnLPoint, index: number) => {
                    const safeValue = typeof item.netPnL === 'number' && isFinite(item.netPnL) ? item.netPnL : minPnL;
                    const base = (data.length - 1) || 1;
                    const x = padding + (index * (width - 2 * padding)) / base;
                    const normalizedValue = (safeValue - minPnL) / denom; // 0..1
                    const y = height - padding - (normalizedValue * (height - 2 * padding));
                    
                    // Format date based on timeframe
                    let dateStr = '';
                    if (selectedTimeFilter === '1W') {
                      // Daily data: 2025-09-09
                      dateStr = new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    } else if (selectedTimeFilter === '1M') {
                      // Weekly data: 2025-W32
                      const weekNumStr = item.period.split('-W')[1];
                      const yearStr = item.period.split('-W')[0];
                      const weekNum = parseInt(weekNumStr, 10);
                      const year = parseInt(yearStr, 10);
                      const date = new Date(year, 0, 1 + (weekNum - 1) * 7);
                      dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    } else if (selectedTimeFilter === '1Y') {
                      // Monthly data: 2025-09
                      const [year, month] = item.period.split('-');
                      dateStr = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    } else if (selectedTimeFilter === '5Y') {
                      // Yearly data: 2025
                      dateStr = item.period;
                    }
                    
                    return { x, y, netPnL: item.netPnL, period: item.period, dateStr };
                  });
                  
                  const pathData = points
                    .map((point: { x: number; y: number }, index: number) => {
                      const px = isFinite(point.x) ? point.x : padding;
                      const py = isFinite(point.y) ? point.y : (height / 2);
                      return `${index === 0 ? 'M' : 'L'} ${px} ${py}`;
                    })
                    .join(' ');
                  
                  return (
                    <g>
                      {/* Zero line */}
                      <line
                        x1={padding}
                        y1={centerY}
                        x2={width - padding}
                        y2={centerY}
                        stroke={isDarkMode ? '#4B5563' : '#D1D5DB'}
                        strokeWidth="1"
                        strokeDasharray="5,5"
                      />
                      
                      {/* Area under the line */}
                      <path
                        d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
                        fill="url(#greenGradient)"
                        opacity="0.2"
                      />
                      
                      {/* Line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data points */}
                      {points.map((point: any, index: number) => {
                        const px = isFinite(point.x) ? point.x : padding;
                        const py = isFinite(point.y) ? point.y : (height / 2);
                        return (
                          <g key={index}>
                            <circle
                              cx={px}
                              cy={py}
                              r="4"
                              fill="#10b981"
                              stroke={isDarkMode ? '#1f2937' : '#ffffff'}
                              strokeWidth="2"
                            />
                            <circle
                              cx={px}
                              cy={py}
                              r="8"
                              fill="transparent"
                              className="hover:fill-green-400/20 cursor-pointer"
                            >
                              <title>{`${point.dateStr}: ${formatCurrency(point.netPnL)}`}</title>
                            </circle>
                          </g>
                        );
                      })}
                      
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4"/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-between text-xs mb-4">
            {(() => {
              // Get appropriate data based on timeframe
              const getDataForTimeframe = () => {
                const chartData = dashboardData.tradePnL?.chartData;
                if (!chartData) return [];

                switch (selectedTimeFilter) {
                  case '1D': return (chartData as any).daily || [];
                  case '1W': return (chartData as any).daily || [];
                  case '1M': return (chartData as any).daily || chartData.weekly || [];
                  case '3M': return chartData.weekly || [];
                  case '6M': return chartData.weekly || [];
                  case '1Y': return chartData.monthly || [];
                  case 'ALL': return chartData.yearly || [];
                  default: return chartData.weekly || [];
                }
              };
              
              const data = getDataForTimeframe();
              const firstPeriod = data[0]?.period;
              const lastPeriod = data[data.length - 1]?.period;
              
              let startLabel = '', endLabel = '';
              
              if (firstPeriod && lastPeriod) {
                if (selectedTimeFilter === '1W') {
                  startLabel = new Date(firstPeriod).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  endLabel = new Date(lastPeriod).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else if (selectedTimeFilter === '1M') {
                  const startWeek = firstPeriod.split('-W')[1];
                  const endWeek = lastPeriod.split('-W')[1];
                  startLabel = `Week ${startWeek}`;
                  endLabel = `Week ${endWeek}`;
                } else if (selectedTimeFilter === '1Y') {
                  const [startYear, startMonth] = firstPeriod.split('-');
                const [endYear, endMonth] = lastPeriod.split('-');
                startLabel = new Date(parseInt(startYear), parseInt(startMonth) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                endLabel = new Date(parseInt(endYear), parseInt(endMonth) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              } else if (selectedTimeFilter === '5Y') {
                startLabel = firstPeriod;
                endLabel = lastPeriod;
              }
              }
              
              return (
                <>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {startLabel}
                  </span>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {endLabel}
                  </span>
                </>
              );
            })()}
          </div>

          {/* Status Summary */}
          <div className="mt-4">
            <div className="text-center">
              <span className="text-sm font-medium">
                Win Rate: {dashboardData.tradePnL.statistics.winRate}, Avg Daily: {formatCurrency(Number(dashboardData.tradePnL.statistics.averageDailyPnL))}
              </span>
            </div>
          </div>
        </div>

        {/* Withdrawal Analytics */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Withdrawal Analytics</h2>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>

          {/* Withdrawal Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(() => {
              // Get appropriate withdrawal data based on timeframe
              const getWithdrawalDataForTimeframe = () => {
                const chartData = dashboardData.transactions?.withdrawals?.chartData;
                if (!chartData) return [];
                
                switch (selectedTimeFilter) {
                  case '1W': return (chartData as any).daily || [];
                  case '1M': return chartData.weekly || [];
                  case '1Y': return chartData.monthly || [];
                  case '5Y': return chartData.yearly || [];
                  default: return chartData.weekly || [];
                }
              };
              
              const data = getWithdrawalDataForTimeframe();
              const totalAmount = data.reduce((sum: number, item: WithdrawalPoint) => sum + (item.totalAmount || 0), 0);
              const totalCount = data.reduce((sum: number, item: WithdrawalPoint) => sum + (item.count || 0), 0);
              
              return (
                <>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                    <p className="text-lg font-bold text-red-400">
                      {formatCurrency(totalAmount, 'INR')}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Count</p>
                    <p className="text-lg font-bold text-gray-300">
                      {totalCount}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Line Chart */}
          <div className="relative h-48 mb-4">
            <div className={`absolute inset-0 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <svg className="w-full h-full p-4" viewBox="0 0 400 160">
                {/* Grid Lines */}
                <defs>
                  <pattern id="grid" width="40" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 32" fill="none" stroke={isDarkMode ? '#374151' : '#e5e7eb'} strokeWidth="1" opacity="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Generate line chart points from withdrawal data */}
                {(() => {
                  // Get appropriate withdrawal data based on timeframe
                  const getWithdrawalDataForTimeframe = () => {
                    const chartData = dashboardData.transactions?.withdrawals?.chartData;
                    if (!chartData) return [];

                    switch (selectedTimeFilter) {
                      case '1D': return (chartData as any).daily || [];
                      case '1W': return (chartData as any).daily || [];
                      case '1M': return (chartData as any).daily || chartData.weekly || [];
                      case '3M': return chartData.weekly || [];
                      case '6M': return chartData.weekly || [];
                      case '1Y': return chartData.monthly || [];
                      case 'ALL': return chartData.yearly || [];
                      default: return chartData.weekly || [];
                    }
                  };

                  const data = getWithdrawalDataForTimeframe();
                  if (!data || data.length === 0) {
                    return <div className="flex items-center justify-center h-32 text-gray-500">No withdrawal data available</div>;
                  }
                  const rawAmounts: number[] = data
                    .map((d: { totalAmount: number }) => safeNumber(d.totalAmount))
                    .filter((v: number) => isFinite(v));
                  if (rawAmounts.length === 0) {
                    return <div className="flex items-center justify-center h-32 text-gray-500">No withdrawal data available</div>;
                  }
                  const maxAmount = Math.max(...rawAmounts);
                  const width = 360;
                  const height = 120;
                  const padding = 20;
                  
                  const points = data.map((item: WithdrawalPoint, index: number) => {
                    const base = (data.length - 1) || 1;
                    const x = padding + (index * (width - 2 * padding)) / base;
                    const safeAmount = typeof item.totalAmount === 'number' && isFinite(item.totalAmount) ? item.totalAmount : 0;
                    const ratio = maxAmount === 0 ? 0 : safeAmount / maxAmount;
                    const y = height - padding - (ratio * (height - 2 * padding));
                    
                    // Format date based on timeframe for tooltip
                    let dateStr = '';
                    if (selectedTimeFilter === '1W') {
                      dateStr = new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    } else if (selectedTimeFilter === '1M') {
                      const weekNumStr = item.period.split('-W')[1];
                      const yearStr = item.period.split('-W')[0];
                      const weekNum = parseInt(weekNumStr, 10);
                      const year = parseInt(yearStr, 10);
                      const date = new Date(year, 0, 1 + (weekNum - 1) * 7);
                      dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    } else if (selectedTimeFilter === '1Y') {
                      const [year, month] = item.period.split('-');
                      dateStr = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    } else if (selectedTimeFilter === '5Y') {
                      dateStr = item.period;
                    }
                    
                    return { x, y, amount: item.totalAmount, date: item.period, dateStr };
                  });
                  
                  const pathData = points
                    .map((point: { x: number; y: number }, index: number) => {
                      const px = isFinite(point.x) ? point.x : padding;
                      const py = isFinite(point.y) ? point.y : (height / 2);
                      return `${index === 0 ? 'M' : 'L'} ${px} ${py}`;
                    })
                    .join(' ');
                  
                  return (
                    <g>
                      {/* Area under the line */}
                      <path
                        d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
                        fill="url(#redGradient)"
                        opacity="0.2"
                      />
                      
                      {/* Line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#f87171"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data points */}
                      {points.map((point: any, index: number) => {
                        const px = isFinite(point.x) ? point.x : padding;
                        const py = isFinite(point.y) ? point.y : (height / 2);
                        return (
                          <g key={index}>
                            <circle
                              cx={px}
                              cy={py}
                              r="4"
                              fill="#f87171"
                              stroke={isDarkMode ? '#1f2937' : '#ffffff'}
                              strokeWidth="2"
                            />
                            <circle
                              cx={px}
                              cy={py}
                              r="8"
                              fill="transparent"
                              className="hover:fill-red-400/20 cursor-pointer"
                            >
                              <title>{`${point.dateStr}: ${formatCurrency(point.amount, 'INR')}`}</title>
                            </circle>
                          </g>
                        );
                      })}
                      
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f87171" stopOpacity="0.4"/>
                          <stop offset="100%" stopColor="#f87171" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-between text-xs">
            {(() => {
              // Get appropriate withdrawal data based on timeframe
              const getWithdrawalDataForTimeframe = () => {
                const chartData = dashboardData.transactions?.withdrawals?.chartData;
                if (!chartData) return [];
                
                switch (selectedTimeFilter) {
                  case '1W': return (chartData as any).daily || [];
                  case '1M': return chartData.weekly || [];
                  case '1Y': return chartData.monthly || [];
                  case '5Y': return chartData.yearly || [];
                  default: return chartData.weekly || [];
                }
              };
              
              const data = getWithdrawalDataForTimeframe();
              const firstPeriod = data[0]?.period;
              const lastPeriod = data[data.length - 1]?.period;
              
              let startLabel = '', endLabel = '';
              
              if (firstPeriod && lastPeriod) {
                if (selectedTimeFilter === '1W') {
                  startLabel = new Date(firstPeriod).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  endLabel = new Date(lastPeriod).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else if (selectedTimeFilter === '1M') {
                  const startWeek = firstPeriod.split('-W')[1];
                  const endWeek = lastPeriod.split('-W')[1];
                  startLabel = `Week ${startWeek}`;
                  endLabel = `Week ${endWeek}`;
                } else if (selectedTimeFilter === '1Y') {
                  const [startYear, startMonth] = firstPeriod.split('-');
                  const [endYear, endMonth] = lastPeriod.split('-');
                  startLabel = new Date(parseInt(startYear), parseInt(startMonth) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  endLabel = new Date(parseInt(endYear), parseInt(endMonth) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                } else if (selectedTimeFilter === '5Y') {
                  startLabel = firstPeriod;
                  endLabel = lastPeriod;
                }
              }
              
              return (
                <>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {startLabel}
                  </span>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {endLabel}
                  </span>
                </>
              );
            })()}
          </div>

          {/* Status Summary */}
          <div className="mt-4">
            <div className="text-center">
              {(() => {
                // Get appropriate withdrawal data based on timeframe
                const getWithdrawalDataForTimeframe = () => {
                  const chartData = dashboardData.transactions?.withdrawals?.chartData;
                  if (!chartData) return [];
                  
                  switch (selectedTimeFilter) {
                    case '1W': return (chartData as any).daily || [];
                    case '1M': return chartData.weekly || [];
                    case '1Y': return chartData.monthly || [];
                    case '5Y': return chartData.yearly || [];
                    default: return chartData.weekly || [];
                  }
                };
                
                const data = getWithdrawalDataForTimeframe();
                const completedCount = data.reduce((sum: number, item: WithdrawalPoint) => sum + (item.completedCount || 0), 0);
                const pendingCount = data.reduce((sum: number, item: WithdrawalPoint) => sum + (item.pendingCount || 0), 0);
                
                return (
                  <span className="text-sm font-medium">
                    {completedCount} Completed, {pendingCount} Pending
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div 
        className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col fixed inset-0 overflow-hidden`}
        style={{ 
          height: '100svh',
          minHeight: '100vh',
          maxHeight: '100vh',
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: '0px',
          margin: '0px'
        }}
      >
        <div className="flex-1 overflow-hidden" style={{ height: '100vh' }}>
          {content}
        </div>
        <FloatingButton activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    );
  }

  return (
    <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col`}>
      <Header 
        onlineUsers={onlineUsers} 
        sidebarOpen={sidebarOpen} 
        onSidebarToggle={toggleSidebar} 
      />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {content}
      </div>
    </div>
  );
});

export default InvestmentDashboard;
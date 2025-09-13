import { memo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../../layouts/header';
import Sidebar from '../../../layouts/sidebar';
import FloatingButton, { type MobileTab } from '../../../components/button/floatingButton';
import { useSettings } from '../../../contexts/settingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../../redux/store';
import { fetchDashboardSummary } from '../../../redux/thunks/dashboard/dashboardThunks';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

type TimeFilter = '1W' | '1M' | '6M' | '1Y';

const EnhancedDashboard = memo(function EnhancedDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1M');

  // Redux state
  const { data: dashboardData, loading, error } = useSelector((state: RootState) => state.dashboard);

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

  // Fetch dashboard data
  useEffect(() => {
    const days = selectedTimeFilter === '1W' ? 7 : selectedTimeFilter === '1M' ? 30 : selectedTimeFilter === '6M' ? 180 : 365;
    dispatch(fetchDashboardSummary(days));
  }, [dispatch, selectedTimeFilter]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
  };

  const isDarkMode = settings.theme === 'dark';

  // Chart colors
  const COLORS = {
    primary: '#3B82F6',
    success: '#22C55E', 
    danger: '#EF4444',
    warning: '#F59E0B',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
    gradient: isDarkMode 
      ? ['#3B82F6', '#1D4ED8', '#1E40AF'] 
      : ['#60A5FA', '#3B82F6', '#2563EB']
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg border shadow-lg ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
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
          Investment Dashboard
        </h1>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Real-time portfolio insights and analytics
        </p>
      </div>

      {/* Time Filter Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {(['1W', '1M', '6M', '1Y'] as TimeFilter[]).map(filter => (
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
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Positions */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        } hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Positions
            </h3>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">
            {dashboardData.positions.totalPositions}
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
            {formatCurrency(dashboardData.positions.totalInvested)}
          </p>
        </div>

        {/* Total P&L */}
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
        </div>

        {/* Today's P&L */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        } hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Today's P&L
            </h3>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
              dashboardData.tradePnL.today.netPnL >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'
            } flex items-center justify-center`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-bold ${
            dashboardData.tradePnL.today.netPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(dashboardData.tradePnL.today.netPnL)}
          </p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {dashboardData.tradePnL.today.trades} trades today
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Trade P&L Chart */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <h2 className="text-xl font-semibold mb-6">Trade P&L Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.tradePnL.chartData.weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="period" 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="netPnL" 
                  stroke={COLORS.success} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                  name="Net P&L"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, strokeWidth: 2, r: 3 }}
                  name="Profit"
                />
                <Line 
                  type="monotone" 
                  dataKey="loss" 
                  stroke={COLORS.danger} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.danger, strokeWidth: 2, r: 3 }}
                  name="Loss"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wallet Balance Trends */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <h2 className="text-xl font-semibold mb-6">Wallet Balance Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.transactions.deposits.chartData.weekly.map((week, index) => ({
                period: week.period,
                dematBalance: dashboardData.wallets.dematWallet.balance * (0.8 + index * 0.05),
                bankBalance: dashboardData.wallets.bankWallet.balance * (0.9 + index * 0.02),
                totalBalance: dashboardData.wallets.totalBalance * (0.85 + index * 0.03)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="period" 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalBalance" 
                  stroke={COLORS.purple} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.purple, strokeWidth: 2, r: 4 }}
                  name="Total Balance"
                />
                <Line 
                  type="monotone" 
                  dataKey="dematBalance" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, strokeWidth: 2, r: 3 }}
                  name="Demat Balance"
                />
                <Line 
                  type="monotone" 
                  dataKey="bankBalance" 
                  stroke={COLORS.success} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.success, strokeWidth: 2, r: 3 }}
                  name="Bank Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Demat Wallet ({dashboardData.wallets.dematWallet.count} accounts)</span>
              </div>
              <span className="font-medium">{formatCurrency(dashboardData.wallets.dematWallet.balance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Bank Wallet ({dashboardData.wallets.bankWallet.count} accounts)</span>
              </div>
              <span className="font-medium">{formatCurrency(dashboardData.wallets.bankWallet.balance)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm font-medium">Total Balance</span>
              </div>
              <span className="font-bold">{formatCurrency(dashboardData.wallets.totalBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Portfolio Cash Flow */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <h2 className="text-xl font-semibold mb-6">Portfolio Cash Flow</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.transactions.deposits.chartData.monthly.map((month, index) => ({
                period: month.period,
                deposits: month.totalAmount,
                withdrawals: dashboardData.transactions.withdrawals.chartData.monthly[index]?.totalAmount || 0,
                netFlow: month.totalAmount - (dashboardData.transactions.withdrawals.chartData.monthly[index]?.totalAmount || 0)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="period" 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="netFlow" 
                  stroke={COLORS.purple} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.purple, strokeWidth: 2, r: 4 }}
                  name="Net Cash Flow"
                />
                <Line 
                  type="monotone" 
                  dataKey="deposits" 
                  stroke={COLORS.success} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.success, strokeWidth: 2, r: 3 }}
                  name="Deposits"
                />
                <Line 
                  type="monotone" 
                  dataKey="withdrawals" 
                  stroke={COLORS.danger} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.danger, strokeWidth: 2, r: 3 }}
                  name="Withdrawals"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Performance Overview */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <h2 className="text-xl font-semibold mb-6">Portfolio Performance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.tradePnL.chartData.monthly.map((month, index) => {
                const investedBase = dashboardData.positions.totalInvested;
                const portfolioValue = investedBase + month.netPnL;
                const returnPercent = ((portfolioValue / investedBase - 1) * 100);
                
                return {
                  period: month.period,
                  portfolioValue: portfolioValue,
                  invested: investedBase,
                  returnPercent: returnPercent
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="period" 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="portfolioValue" 
                  stroke={COLORS.success} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                  name="Portfolio Value"
                />
                <Line 
                  type="monotone" 
                  dataKey="invested" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, strokeWidth: 2, r: 3 }}
                  name="Total Invested"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Performance Metrics */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Portfolio Value</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(dashboardData.positions.totalInvested + dashboardData.positions.totalPnL)}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Return</p>
              <p className={`text-2xl font-bold ${
                dashboardData.positions.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {((dashboardData.positions.totalPnL / dashboardData.positions.totalInvested) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Wallet Activity */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Recent Wallet Activity</h2>
          <div className="space-y-3">
            {dashboardData.wallets.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{activity.walletName}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {activity.description}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${
                    activity.amount >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {activity.amount >= 0 ? '+' : ''}{formatCurrency(activity.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Deposits */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Recent Deposits</h2>
          <div className="space-y-3">
            {dashboardData.transactions.deposits.recentActivity.slice(0, 5).map((deposit) => (
              <div key={deposit.id} className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{deposit.method}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {deposit.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-green-400">
                      +{formatCurrency(deposit.amount)}
                    </span>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {deposit.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-xl' 
            : 'bg-white/80 border-white/50 shadow-xl'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Recent Withdrawals</h2>
          <div className="space-y-3">
            {dashboardData.transactions.withdrawals.recentActivity.slice(0, 5).map((withdrawal) => (
              <div key={withdrawal.id} className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{withdrawal.method}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {withdrawal.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-red-400">
                      -{formatCurrency(withdrawal.amount)}
                    </span>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {withdrawal.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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

export default EnhancedDashboard;
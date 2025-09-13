import { memo, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSettings } from '../../../contexts/settingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../redux/store';
import { fetchWithdrawals, createWithdrawal, updateWithdrawal, deleteWithdrawal } from '../../../redux/thunks/withdrawals/withdrawalsThunks';
import ConfirmModal from '../../../components/modal/confirmModal';
import { AddWithdrawModal, EditWithdrawModal } from './components/modal';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';


// Deprecated local type kept for context; using API DTO via Redux now
interface WithdrawalRecord {
  id: string;
  amount: number;
  requestedAt: string;
  description?: string;
}

interface ChartDataPoint {
  date: string;
  amount: number;
}

type TimeFilter = '1M' | '1W' | '6M' | '1Y' | '5Y';

// Helper functions for formatting
const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
const formatCurrencyWithUSD = (amount: number) => {
  const usdAmount = (amount / 89).toFixed(2);
  return {
    inr: `₹${amount.toLocaleString()}`,
    usd: `$${usdAmount}`
  };
};
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

const Withdraw = memo(function Withdraw() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1M');
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const { items: withdrawals, loading, creating, error } = useSelector((s: RootState) => s.withdrawals);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

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

  // Load withdrawals from API
  useEffect(() => {
    dispatch(fetchWithdrawals());
  }, [dispatch]);

  // Refetch when window gains focus or page becomes visible
  useEffect(() => {
    const onFocus = () => dispatch(fetchWithdrawals());
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        dispatch(fetchWithdrawals());
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dispatch]);



  const isDarkMode = settings.theme === 'dark';

  // Generate chart data based on selected time filter
  const generateChartData = (timeFilter: TimeFilter): ChartDataPoint[] => {
    const now = new Date();
    const dataPoints: ChartDataPoint[] = [];
    let days = 30; // Default 1M

    switch (timeFilter) {
      case '1W': days = 7; break;
      case '1M': days = 30; break;
      case '6M': days = 180; break;
      case '1Y': days = 365; break;
      case '5Y': days = 1825; break;
    }

    // Filter withdrawals within the selected time period first
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredWithdrawals = withdrawals.filter(w => {
      const withdrawalDate = new Date((w as any).requestedAt);
      return withdrawalDate >= cutoffDate && withdrawalDate <= now;
    });

    // Generate daily cumulative data for the selected period
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Calculate withdrawals made on or before this date (within the filtered set)
      const dateStr = date.toISOString().split('T')[0];
      const withdrawalsUpToDate = filteredWithdrawals.filter(w =>
        new Date((w as any).requestedAt) <= date
      );
      const totalAmount = withdrawalsUpToDate.reduce((sum, w) => sum + w.amount, 0);

      dataPoints.push({
        date: dateStr,
        amount: totalAmount
      });
    }

    return dataPoints;
  };

  const chartData = generateChartData(selectedTimeFilter);

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`rounded-lg border p-3 shadow-lg ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-300 text-gray-900'
        }`}>
          <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {formatDate(label)}
          </p>
          <p className="font-bold text-red-500">
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleWithdrawSubmit = async (data: { amount: number; platform: string; description: string }) => {
    try {
      await dispatch(createWithdrawal({ 
        amount: data.amount,
        description: data.description || undefined,
        method: data.platform || undefined
      })).unwrap();
      
      toast.success('Withdrawal recorded successfully');
      setShowWithdrawModal(false);
    } catch (error) {
      toast.error('Failed to record withdrawal');
    }
  };


  // Filter withdrawals based on selected time filter and search query
  const getTimeFilteredWithdrawals = () => {
    const now = new Date();
    let cutoffDate = new Date();

    switch (selectedTimeFilter) {
      case '1W': cutoffDate.setDate(now.getDate() - 7); break;
      case '1M': cutoffDate.setDate(now.getDate() - 30); break; // Use days instead of months for consistency
      case '6M': cutoffDate.setDate(now.getDate() - 180); break; // Use days instead of months for consistency
      case '1Y': cutoffDate.setDate(now.getDate() - 365); break; // Use days instead of years for consistency
      case '5Y': cutoffDate.setDate(now.getDate() - 1825); break; // Use days instead of years for consistency
    }

    return withdrawals.filter(withdrawal => {
      const withdrawalDate = new Date((withdrawal as any).requestedAt);
      return withdrawalDate >= cutoffDate && withdrawalDate <= now;
    });
  };

  // Get time-filtered withdrawals for statistics
  const timeFilteredWithdrawals = getTimeFilteredWithdrawals();

  // Filter and sort withdrawals for display (includes search filter)
  const filteredWithdrawals = timeFilteredWithdrawals
    .filter(withdrawal => {
      const matchesSearch = searchQuery === '' ||
        withdrawal.amount.toString().includes(searchQuery) ||
        (withdrawal.description && withdrawal.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    })
    .sort((a, b) => {
      const aValue = sortBy === 'date' ? new Date((a as any).requestedAt).getTime() : a.amount;
      const bValue = sortBy === 'date' ? new Date((b as any).requestedAt).getTime() : b.amount;

      return sortOrder === 'asc' ?
        (aValue > bValue ? 1 : -1) :
        (aValue < bValue ? 1 : -1);
    });

  // Statistics calculations based on time-filtered data (not search-filtered)
  const totalWithdrawals = timeFilteredWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const avgWithdrawal = timeFilteredWithdrawals.length > 0 ? totalWithdrawals / timeFilteredWithdrawals.length : 0;
  const maxWithdrawal = timeFilteredWithdrawals.length > 0 ? Math.max(...timeFilteredWithdrawals.map(w => w.amount)) : 0;

  const content = (
    <div className={`flex-1 p-6 overflow-y-auto ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Page Header */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Withdraw Funds
            </h1>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your fund withdrawals and track transaction history
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Withdrawal</span>
              </div>
            </button>
            
            <button
              onClick={() => dispatch(fetchWithdrawals())}
              disabled={loading}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                loading 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </div>
              )}
            </button>
            
            <div className={`px-3 py-1 rounded-lg ${
              isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
            }`}>
              <span className="text-sm font-medium">
                {filteredWithdrawals.length} Withdrawals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 75% - 25% Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Content Area - 75% */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Enhanced Statistics Cards with Timeframe */}
          <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Statistics Overview
              </h3>
              
              {/* Timeframe Selector */}
              <div className="flex gap-2 mt-4 lg:mt-0">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center mr-2`}>
                  Period:
                </span>
                {(['1W', '1M', '6M', '1Y', '5Y'] as TimeFilter[]).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSelectedTimeFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                      selectedTimeFilter === filter
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
                isDarkMode ? 'bg-gray-700/30 border-gray-600/50' : 'bg-white/60 border-white/30'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Withdrawn ({selectedTimeFilter})</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrencyWithUSD(totalWithdrawals).inr}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {formatCurrencyWithUSD(totalWithdrawals).usd}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
                isDarkMode ? 'bg-gray-700/30 border-gray-600/50' : 'bg-white/60 border-white/30'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg. Withdrawal</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrencyWithUSD(avgWithdrawal).inr}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {formatCurrencyWithUSD(avgWithdrawal).usd}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
                isDarkMode ? 'bg-gray-700/30 border-gray-600/50' : 'bg-white/60 border-white/30'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Largest Withdrawal</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrencyWithUSD(maxWithdrawal).inr}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {formatCurrencyWithUSD(maxWithdrawal).usd}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filters Section */}
          <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search and Sort */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <svg className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search withdrawals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                </div>

                {/* Sort Options */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="date">Sort by Date</option>
                    <option value="amount">Sort by Amount</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className={`px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    <svg className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || sortBy !== 'date' || sortOrder !== 'desc') && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700/30">
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active filters:</span>
                
                {searchQuery && (
                  <span className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-red-500"
                    >×</button>
                  </span>
                )}
                
                {sortBy !== 'date' && (
                  <span className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                    Sort by: {sortBy}
                  </span>
                )}
                
                {sortOrder !== 'desc' && (
                  <span className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                    Order: {sortOrder}
                  </span>
                )}
                
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSortBy('date');
                    setSortOrder('desc');
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Withdrawal Chart */}
          <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
            isDarkMode 
              ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
              : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Withdrawal History</h2>
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-lg ${
                  isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                }`}>
                  <span className="text-sm font-medium">
                    {filteredWithdrawals.length} Withdrawals
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(fetchWithdrawals())}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    loading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? 'Loading…' : 'Refresh'}
                </button>
              </div>
            </div>
            <div className="h-80">
              {chartData.length === 0 ? (
                <div className={`flex items-center justify-center h-full ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-lg font-medium">No withdrawal data</p>
                    <p className="text-sm opacity-75">Data will appear here once you make withdrawals</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? '#374151' : '#E5E7EB'}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                      fontSize={12}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                      fontSize={12}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#DC2626"
                      strokeWidth={3}
                      dot={{ fill: '#DC2626', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#EF4444' }}
                      name="Withdrawn Amount"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Sidebar - 25% */}
        <div className={`lg:col-span-1 p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredWithdrawals.length === 0 ? (
              <div className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              filteredWithdrawals.slice(0, 10).map(withdrawal => (
                <div key={withdrawal.id} className={`p-3 rounded-lg border transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50' 
                    : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{formatCurrencyWithUSD(withdrawal.amount).inr}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        {formatCurrencyWithUSD(withdrawal.amount).usd}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date((withdrawal as any).requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-red-400 mt-1"></div>
                  </div>
                  
                  {withdrawal.description && (
                    <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>
                      {withdrawal.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                    }`}>
                      WITHDRAWN
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                          isDarkMode 
                            ? 'text-blue-400 hover:bg-blue-500/20' 
                            : 'text-blue-600 hover:bg-blue-100'
                        }`}
                        onClick={() => setEditId(withdrawal.id)}
                        title="Edit withdrawal"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                          isDarkMode 
                            ? 'text-red-400 hover:bg-red-500/20' 
                            : 'text-red-600 hover:bg-red-100'
                        }`}
                        onClick={() => setConfirmDeleteId(withdrawal.id)}
                        title="Delete withdrawal"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {filteredWithdrawals.length > 10 && (
              <div className={`text-center py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <p className="text-xs">Showing latest 10 of {filteredWithdrawals.length} withdrawals</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Withdrawal Modal */}
      <AddWithdrawModal
        open={showWithdrawModal}
        isDarkMode={isDarkMode}
        onClose={() => setShowWithdrawModal(false)}
        onSubmit={handleWithdrawSubmit}
        loading={creating}
        error={error}
      />
    </div>
  );

  return (
    <div className={`h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col p-6 overflow-y-auto`}>
      {content}

      {/* Delete confirm modal */}
      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete withdrawal?"
        message="This action cannot be undone."
        isDarkMode={isDarkMode}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            dispatch(deleteWithdrawal({ id: confirmDeleteId }));
          }
          setConfirmDeleteId(null);
        }}
      />

      {/* Edit modal */}
      <EditWithdrawModal
        open={!!editId}
        isDarkMode={isDarkMode}
        initial={{
          amount: editId ? (withdrawals.find(w => w.id === editId)?.amount ?? 0) : 0,
          method: editId ? withdrawals.find(w => w.id === editId)?.method : undefined,
          description: editId ? withdrawals.find(w => w.id === editId)?.description : undefined,
        }}
        onCancel={() => setEditId(null)}
        onSave={(patch) => {
          if (editId) {
            dispatch(updateWithdrawal({ id: editId, patch: patch as any }));
          }
          setEditId(null);
        }}
      />
    </div>
  );
});

export default Withdraw;
import { memo, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSettings } from '../../../contexts/settingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../redux/store';
import { fetchDeposits, createDeposit, updateDeposit, deleteDeposit } from '../../../redux/thunks/deposits/depositsThunks';
import { fetchWithdrawals } from '../../../redux/thunks/withdrawals/withdrawalsThunks';
import ConfirmModal from '../../../components/modal/confirmModal';
import { AddDepositModal, EditDepositModal } from './components/modal';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';


// Using API DTO via Redux now
// interface kept for local computations if needed
interface DepositRecord { id: string; amount: number; requestedAt: string; description?: string; method?: string; }

interface ChartDataPoint {
  date: string;
  amount: number;
}

type TimeFilter = '1M' | '1W' | '6M' | '1Y' | '5Y';
type MobileTab = 'chart' | 'list';

// Helper functions for formatting
const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

// Format currency with both INR and USD
const formatCurrencyWithUSD = (amount: number) => {
  const usdAmount = (amount / 89).toFixed(2);
  return {
    inr: `₹${amount.toLocaleString()}`,
    usd: `$${usdAmount}`
  };
};

const Deposit = memo(function Deposit() {
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
  const [showDepositModal, setShowDepositModal] = useState(false);
  const { items: deposits, loading, creating, error } = useSelector((s: RootState) => s.deposits);
  const withdrawals = useSelector((state: RootState) => state.withdrawals.items);
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

  // Load deposits and withdrawals from API
  useEffect(() => {
    dispatch(fetchDeposits());
    dispatch(fetchWithdrawals());
  }, [dispatch]);

  // Refetch when window gains focus or page becomes visible
  useEffect(() => {
    const onFocus = () => dispatch(fetchDeposits());
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        dispatch(fetchDeposits());
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

    // Filter deposits within the selected time period first
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredDeposits = deposits.filter(d => {
      const depositDate = new Date((d as any).requestedAt || (d as any).depositedAt);
      return depositDate >= cutoffDate && depositDate <= now;
    });

    // Generate daily cumulative data for the selected period
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Calculate deposits made on or before this date (within the filtered set)
      const dateStr = date.toISOString().split('T')[0];
      const depositsUpToDate = filteredDeposits.filter(d =>
        new Date((d as any).requestedAt || (d as any).depositedAt) <= date
      );
      const totalAmount = depositsUpToDate.reduce((sum, d) => sum + d.amount, 0);

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
          <p className="font-bold text-green-500">
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleDepositSubmit = async (data: { amount: number; platform: string; description: string }) => {
    try {
      await dispatch(createDeposit({
        amount: data.amount,
        description: data.description || undefined,
        method: data.platform || undefined
      })).unwrap();
      
      toast.success("Deposit recorded successfully");
      setShowDepositModal(false);
    } catch (error) {
      toast.error("Failed to record deposit");
    }
  };

  // Filter and sort deposits
  const filteredDeposits = deposits
    .filter(deposit => {
      const depositDate = new Date((deposit as any).requestedAt || (deposit as any).depositedAt);
      const now = new Date();
      let cutoffDate = new Date();

      switch (selectedTimeFilter) {
        case '1W': cutoffDate.setDate(now.getDate() - 7); break;
        case '1M': cutoffDate.setMonth(now.getMonth() - 1); break;
        case '6M': cutoffDate.setMonth(now.getMonth() - 6); break;
        case '1Y': cutoffDate.setFullYear(now.getFullYear() - 1); break;
        case '5Y': cutoffDate.setFullYear(now.getFullYear() - 5); break;
      }

      const matchesTimeFilter = depositDate >= cutoffDate;
      const matchesSearch = searchQuery === '' || 
        deposit.amount.toString().includes(searchQuery) ||
        (deposit.description && deposit.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTimeFilter && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = sortBy === 'date' ? 
        new Date((a as any).requestedAt || (a as any).depositedAt).getTime() : 
        a.amount;
      const bValue = sortBy === 'date' ? 
        new Date((b as any).requestedAt || (b as any).depositedAt).getTime() : 
        b.amount;
      
      return sortOrder === 'asc' ? 
        (aValue > bValue ? 1 : -1) : 
        (aValue < bValue ? 1 : -1);
    });

  const totalDeposits = filteredDeposits.reduce((sum, d) => sum + d.amount, 0);

  // Calculate withdrawal total based on the same timeframe filter
  const calculateWithdrawalTotal = () => {
    if (!withdrawals || withdrawals.length === 0) return 0;

    const now = new Date();
    let cutoffDate = new Date();

    switch (selectedTimeFilter) {
      case '1W': cutoffDate.setDate(now.getDate() - 7); break;
      case '1M': cutoffDate.setMonth(now.getMonth() - 1); break;
      case '6M': cutoffDate.setMonth(now.getMonth() - 6); break;
      case '1Y': cutoffDate.setFullYear(now.getFullYear() - 1); break;
      case '5Y': cutoffDate.setFullYear(now.getFullYear() - 5); break;
    }

    return withdrawals
      .filter(w => {
        // Filter by status - include completed and pending
        if (w.status !== 'completed' && w.status !== 'pending') return false;

        // Filter by timeframe
        const dateField = w.completedAt || w.requestedAt;
        if (!dateField) return false;
        const withdrawalDate = new Date(dateField);
        return withdrawalDate >= cutoffDate;
      })
      .reduce((sum, w) => sum + (w.amount || 0), 0);
  };

  // Calculate net amount (deposits - withdrawals) = investment/loss
  const calculateNetAmount = () => {
    const totalWithdrawals = calculateWithdrawalTotal();
    return totalDeposits - totalWithdrawals;
  };

  // Calculate loan (withdrawal - deposit)
  const calculateLoan = () => {
    const totalWithdrawals = calculateWithdrawalTotal();
    return totalWithdrawals - totalDeposits;
  };

  const content = (
    <div className={`flex-1 p-3 sm:p-6 overflow-y-auto overflow-x-hidden ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Page Header */}
      <div className={`p-4 sm:p-6 rounded-2xl backdrop-blur-lg border mb-6 sm:mb-8 ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Loan
            </h1>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your loan deposits and track transaction history
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Deposit</span>
              </div>
            </button>
            
            <button
              onClick={() => dispatch(fetchDeposits())}
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
              isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
            }`}>
              <span className="text-sm font-medium">
                {filteredDeposits.length} Deposits
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Layout Split */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Main Content Area */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Enhanced Statistics Cards with Timeframe */}
          <div className={`p-4 sm:p-6 rounded-2xl backdrop-blur-lg border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
          }`}>
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Statistics Overview
              </h3>
              
              {/* Timeframe Selector */}
              <div className="flex flex-wrap gap-2 mt-4 xl:mt-0">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
                isDarkMode ? 'bg-gray-700/30 border-gray-600/50' : 'bg-white/60 border-white/30'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Deposit</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {totalDeposits.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
                isDarkMode ? 'bg-gray-700/30 border-gray-600/50' : 'bg-white/60 border-white/30'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Outstanding Loan</p>
                    <p className={`text-2xl font-bold ${calculateLoan() > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {calculateLoan() > 0 ? '-' : ''}{Math.abs(calculateLoan()).toLocaleString()}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {calculateLoan() > 0 ? 'Withdrawals exceed deposits' : 'No outstanding loan'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Combined Withdrawals & Net Return Card */}
          <div className={`p-4 sm:p-6 rounded-2xl backdrop-blur-lg border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Withdrawal & Return Overview ({selectedTimeFilter})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Withdrawals */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Withdrawals</p>
                  <div className="flex flex-col space-y-1">
                    <p className={`text-xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      {formatCurrencyWithUSD(calculateWithdrawalTotal()).inr}
                    </p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-500'}`}>
                      {formatCurrencyWithUSD(calculateWithdrawalTotal()).usd}
                    </p>
                  </div>
                </div>
              </div>

              {/* Net Investment */}
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  calculateNetAmount() <= 0
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                    : 'bg-gradient-to-br from-red-500 to-rose-500'
                }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {calculateNetAmount() <= 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8M3 17l4-4m0 0V9m0 4l4-4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8M3 7l4 4m0 0v4m0-4l4-4" />
                    )}
                  </svg>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Net Investment</p>
                  <div className="flex flex-col space-y-1">
                    <p className={`text-xl font-bold ${
                      calculateNetAmount() <= 0
                        ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                        : (isDarkMode ? 'text-red-400' : 'text-red-600')
                    }`}>
                      {calculateNetAmount() > 0 ? '-' : '+'}{formatCurrencyWithUSD(Math.abs(calculateNetAmount())).inr}
                    </p>
                    <p className={`text-sm font-medium ${
                      calculateNetAmount() <= 0
                        ? (isDarkMode ? 'text-green-300' : 'text-green-500')
                        : (isDarkMode ? 'text-red-300' : 'text-red-500')
                    }`}>
                      {calculateNetAmount() > 0 ? '-' : '+'}{formatCurrencyWithUSD(Math.abs(calculateNetAmount())).usd}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700/30 flex justify-between items-center text-xs">
              <div className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                <span>Net Investment = Deposits - Withdrawals</span>
                {deposits && deposits.length > 0 && (
                  <span className="ml-4">• {deposits.length} deposit records</span>
                )}
                {withdrawals && withdrawals.length > 0 && (
                  <span className="ml-2">• {withdrawals.length} withdrawal records</span>
                )}
              </div>
              <span className={`px-2 py-1 rounded ${
                calculateNetAmount() <= 0
                  ? (isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                  : (isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
              }`}>
                {calculateNetAmount() > 0 ? 'Investment Active' : 'Profit Withdrawn'}
              </span>
            </div>
          </div>

          {/* Enhanced Filters Section */}
          <div className={`p-4 sm:p-6 rounded-2xl backdrop-blur-lg border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
          }`}>
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              {/* Search and Sort */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <svg className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search deposits..."
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

          {/* Deposit Chart */}
          <div className={`p-4 sm:p-6 lg:p-8 rounded-2xl backdrop-blur-lg border ${
            isDarkMode 
              ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
              : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Deposit History</h2>
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-lg ${
                  isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                }`}>
                  <span className="text-sm font-medium">
                    {filteredDeposits.length} Deposits
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(fetchDeposits())}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    loading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? 'Loading…' : 'Refresh'}
                </button>
              </div>
            </div>
            <div className="h-64 sm:h-80">
              {chartData.length === 0 ? (
                <div className={`flex items-center justify-center h-full ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-lg font-medium">No deposit data</p>
                    <p className="text-sm opacity-75">Data will appear here once you make deposits</p>
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
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#34D399' }}
                      name="Deposited Amount"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* Recent Activity Sidebar */}
        <div className={`xl:col-span-1 p-4 sm:p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          
          <div className="space-y-3 max-h-[600px] sm:max-h-[800px] lg:max-h-[900px] overflow-y-auto">
            {filteredDeposits.length === 0 ? (
              <div className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              filteredDeposits.slice(0, 10).map(deposit => (
                <div key={deposit.id} className={`p-3 rounded-lg border transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50' 
                    : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-lg">${deposit.amount.toLocaleString()}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date((deposit as any).requestedAt || (deposit as any).depositedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1"></div>
                  </div>
                  
                  {deposit.description && (
                    <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>
                      {deposit.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                    }`}>
                      DEPOSITED
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                          isDarkMode 
                            ? 'text-blue-400 hover:bg-blue-500/20' 
                            : 'text-blue-600 hover:bg-blue-100'
                        }`}
                        onClick={() => setEditId(deposit.id)}
                        title="Edit deposit"
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
                        onClick={() => setConfirmDeleteId(deposit.id)}
                        title="Delete deposit"
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
            
            {filteredDeposits.length > 10 && (
              <div className={`text-center py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <p className="text-xs">Showing latest 10 of {filteredDeposits.length} deposits</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Deposit Modal */}
      <AddDepositModal
        open={showDepositModal}
        isDarkMode={isDarkMode}
        onClose={() => setShowDepositModal(false)}
        onSubmit={handleDepositSubmit}
        loading={creating}
        error={error}
      />
    </div>
  );

  return (
    <div className={`h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col overflow-hidden`}>
      {content}

      {/* Delete confirm modal */}
      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete deposit?"
        message="This action cannot be undone."
        isDarkMode={isDarkMode}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            dispatch(deleteDeposit({ id: confirmDeleteId }));
          }
          setConfirmDeleteId(null);
        }}
      />

      {/* Edit modal */}
      <EditDepositModal
        open={!!editId}
        isDarkMode={isDarkMode}
        initial={{
          amount: editId ? (deposits.find(d => d.id === editId)?.amount ?? 0) : 0,
          method: editId ? deposits.find(d => d.id === editId)?.method : undefined,
          description: editId ? deposits.find(d => d.id === editId)?.description : undefined,
        }}
        onCancel={() => setEditId(null)}
        onSave={(patch) => {
          if (editId) {
            dispatch(updateDeposit({ id: editId, patch: patch as any }));
          }
          setEditId(null);
        }}
      />
    </div>
  );
});

export default Deposit;
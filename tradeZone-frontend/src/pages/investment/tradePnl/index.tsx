import React, { memo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useSettings } from '../../../contexts/settingsContext';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import type { RootState, AppDispatch } from '../../../redux/store';
import {
  fetchTradePnL,
  fetchTradePnLPaginated,
  createTradePnL,
  updateTradePnL,
  deleteTradePnL,
  fetchTradePnLStatistics
} from '../../../redux/thunks/tradePnL/tradePnLThunks';
import { fetchWithdrawals } from '../../../redux/thunks/withdrawals/withdrawalsThunks';
import { fetchDeposits } from '../../../redux/thunks/deposits/depositsThunks';
import { clearError } from '../../../redux/slices/tradePnLSlice';
import AddTradePnLModal from './components/addTradePnLModal';
import EditTradePnLModal from './components/editTradePnLModal';
import ImportTradePnLModal from './components/importTradePnLModal';
import ConfirmModal from '../../../components/modal/confirmModal';
import RoundedButton from '../../../components/button/RoundedButton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const TradePnL = memo(function TradePnL() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    period: '', // days for statistics - default All
    dataFilter: '', // days for data filtering - default All
    dateFilterType: 'preset', // 'preset' or 'custom'
    startDate: '',
    endDate: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(1000);

  // Redux state
  const { items, statistics, pagination, loading, creating, updating, deleting, error } = useSelector(
    (state: RootState) => state.tradePnL
  );


  const withdrawals = useSelector((state: RootState) => state.withdrawals.items);
  const deposits = useSelector((state: RootState) => state.deposits.items);

  const isDarkMode = settings.theme === 'dark';

  // Redirect if no permission
  useEffect(() => {
    if (!canAccessInvestment()) {
      navigate('/zone');
    }
  }, [canAccessInvestment, navigate]);


  // Fetch data on mount and when filters change
  useEffect(() => {
    const effectiveFilter = getEffectiveFilterValue();
    const days = effectiveFilter ? parseInt(effectiveFilter) : undefined;
    dispatch(fetchTradePnLPaginated({
      days,
      page: currentPage,
      limit: itemsPerPage
    }));
    dispatch(fetchTradePnLStatistics(days));
    dispatch(fetchWithdrawals());
    dispatch(fetchDeposits());
  }, [dispatch, filters, currentPage, itemsPerPage]);

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.dataFilter, filters.dateFilterType, filters.startDate, filters.endDate, itemsPerPage]);


  // Handler functions
  const handleAddNew = () => {
    setShowAddModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteTradePnL({ id })).unwrap();
      toast.success('Record deleted successfully');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      period: '7',
      dataFilter: '7',
      dateFilterType: 'preset',
      startDate: '',
      endDate: ''
    });
  };

  // Calculate days difference for custom date range
  const calculateDaysFromCustomRange = () => {
    if (filters.dateFilterType === 'custom' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  };

  // Get the effective filter value (for API calls)
  const getEffectiveFilterValue = () => {
    if (filters.dateFilterType === 'custom') {
      const customDays = calculateDaysFromCustomRange();
      return customDays ? customDays.toString() : '';
    }
    return filters.dataFilter;
  };

  // Calculate totals
  const totals = items.reduce((acc, item) => ({
    profit: acc.profit + item.profit,
    loss: acc.loss + item.loss,
    netPnL: acc.netPnL + item.netPnL,
    trades: acc.trades + (item.totalTrades || 0),
    wins: acc.wins + (item.winningTrades || 0),
    losses: acc.losses + (item.losingTrades || 0),
  }), { profit: 0, loss: 0, netPnL: 0, trades: 0, wins: 0, losses: 0 });

  // Calculate withdrawal total based on timeframe filter
  const calculateWithdrawalTotal = () => {
    if (!withdrawals || withdrawals.length === 0) return 0;

    const now = new Date();
    const days = filters.dataFilter ? parseInt(filters.dataFilter) : null;

    // Filter based on status - considering both completed and pending if needed
    const relevantWithdrawals = withdrawals.filter(w =>
      w.status === 'completed' || w.status === 'pending'
    );

    if (!days || isNaN(days)) {
      // All time
      return relevantWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return relevantWithdrawals
      .filter(w => {
        // Use requestedAt as the primary date field
        const dateField = w.completedAt || w.requestedAt;
        if (!dateField) return false;
        const withdrawalDate = new Date(dateField);
        return withdrawalDate >= cutoffDate;
      })
      .reduce((sum, w) => sum + (w.amount || 0), 0);
  };

  // Format currency with both INR and USD
  const formatCurrencyWithUSD = (amount: number) => {
    const usdAmount = (amount / 89).toFixed(2);
    return {
      inr: `₹${amount.toLocaleString()}`,
      usd: `$${usdAmount}`
    };
  };

  // Calculate deposit total based on timeframe filter
  const calculateDepositTotal = () => {
    if (!deposits || deposits.length === 0) return 0;

    const days = filters.dataFilter ? parseInt(filters.dataFilter) : null;

    if (!days || isNaN(days)) {
      // All time
      return deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return deposits
      .filter(d => {
        const dateField = (d as any).requestedAt || (d as any).depositedAt;
        if (!dateField) return false;
        const depositDate = new Date(dateField);
        return depositDate >= cutoffDate;
      })
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  };

  // Calculate net amount (deposits - withdrawals) = investment/loss
  const calculateNetAmount = () => {
    const totalWithdrawals = calculateWithdrawalTotal();
    const totalDeposits = calculateDepositTotal();
    return totalDeposits - totalWithdrawals;
  };

  const content = (
    <div className={`flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Main Content - 75% on desktop, full width on mobile */}
      <div className="flex-1 min-w-0">
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <p>Error: {error}</p>
            <button 
              onClick={() => dispatch(clearError())} 
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Trade P&L Tracker
          </h1>
          <div className="flex space-x-3">
            {/* Import Excel Button */}
            <RoundedButton
              onClick={() => setShowImportModal(true)}
              variant="purple"
              isDarkMode={isDarkMode}
            >
              Import Excel
            </RoundedButton>
            {/* Add Today's P&L Button */}
            <RoundedButton
              onClick={handleAddNew}
              disabled={creating}
              variant="primary"
              isDarkMode={isDarkMode}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {creating ? 'Adding...' : "Add Today's P&L"}
            </RoundedButton>
          </div>
        </div>
      </div>

      {/* Combined Deposits, Withdrawals & Net Amount Card */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-6 ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Deposit & Withdrawal Overview ({
            filters.dateFilterType === 'custom' && filters.startDate && filters.endDate
              ? `${filters.startDate} to ${filters.endDate}`
              : filters.dataFilter === '' ? 'All Time'
              : filters.dataFilter === '1' ? 'Today'
              : `Last ${filters.dataFilter} Days`
          })
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Deposits */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Deposits</p>
              <div className="flex flex-col space-y-1">
                <p className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {formatCurrencyWithUSD(calculateDepositTotal()).inr}
                </p>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`}>
                  {formatCurrencyWithUSD(calculateDepositTotal()).usd}
                </p>
              </div>
            </div>
          </div>

          {/* Total Withdrawals */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Withdrawals</p>
              <div className="flex flex-col space-y-1">
                <p className={`text-lg font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {formatCurrencyWithUSD(calculateWithdrawalTotal()).inr}
                </p>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-500'}`}>
                  {formatCurrencyWithUSD(calculateWithdrawalTotal()).usd}
                </p>
              </div>
            </div>
          </div>

          {/* Net Amount (Deposits - Withdrawals) */}
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              calculateNetAmount() >= 0
                ? 'bg-gradient-to-br from-red-500 to-rose-500'
                : 'bg-gradient-to-br from-green-500 to-emerald-500'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {calculateNetAmount() >= 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8M3 7l4 4m0 0v4m0-4l4-4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8M3 17l4-4m0 0V9m0 4l4-4" />
                )}
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Net Amount</p>
              <div className="flex flex-col space-y-1">
                <p className={`text-lg font-bold ${
                  calculateNetAmount() >= 0
                    ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                    : (isDarkMode ? 'text-green-400' : 'text-green-600')
                }`}>
                  {calculateNetAmount() >= 0 ? '-' : '+'}{formatCurrencyWithUSD(Math.abs(calculateNetAmount())).inr}
                </p>
                <p className={`text-xs font-medium ${
                  calculateNetAmount() >= 0
                    ? (isDarkMode ? 'text-red-300' : 'text-red-500')
                    : (isDarkMode ? 'text-green-300' : 'text-green-500')
                }`}>
                  {calculateNetAmount() >= 0 ? '-' : '+'}{formatCurrencyWithUSD(Math.abs(calculateNetAmount())).usd}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700/30 flex justify-between items-center text-xs">
          <div className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
            <span>Net Amount = Deposits - Withdrawals</span>
            {deposits && deposits.length > 0 && (
              <span className="ml-4">• {deposits.length} deposit records</span>
            )}
            {withdrawals && withdrawals.length > 0 && (
              <span className="ml-4">• {withdrawals.length} withdrawal records</span>
            )}
          </div>
          <span className={`px-2 py-1 rounded ${
            calculateNetAmount() >= 0
              ? (isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
              : (isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
          }`}>
            {calculateNetAmount() >= 0 ? 'Investment Active' : 'Profit Made'}
          </span>
        </div>
      </div>

      {/* Enhanced Filters - All in one horizontal line */}
      <div className={`p-4 rounded-2xl backdrop-blur-lg border mb-6 ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Date Filter Type */}
          <div className="flex items-center space-x-4">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Filter:
            </span>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="dateFilterType"
                value="preset"
                checked={filters.dateFilterType === 'preset'}
                onChange={(e) => handleFilterChange('dateFilterType', e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Preset
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="dateFilterType"
                value="custom"
                checked={filters.dateFilterType === 'custom'}
                onChange={(e) => handleFilterChange('dateFilterType', e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Custom
              </span>
            </label>
          </div>

          {/* Preset or Custom Filter Options */}
          {filters.dateFilterType === 'preset' ? (
            <select
              value={filters.dataFilter}
              onChange={(e) => handleFilterChange('dataFilter', e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm border ${
                isDarkMode
                  ? 'bg-gray-700/50 border-gray-600/50 text-white'
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              }`}
            >
              <option value="">All Time</option>
              <option value="1">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="180">Last 6 Months</option>
              <option value="365">Last 1 Year</option>
            </select>
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600/50 text-white'
                    : 'bg-white/70 border-gray-300/50 text-gray-900'
                }`}
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600/50 text-white'
                    : 'bg-white/70 border-gray-300/50 text-gray-900'
                }`}
              />
              {filters.startDate && filters.endDate && (
                <span className={`text-xs px-2 py-1 rounded ${
                  isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                }`}>
                  {calculateDaysFromCustomRange()} days
                </span>
              )}
            </div>
          )}

          {/* Items per page and Reset button */}
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Items:
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              className={`px-3 py-2 rounded-lg text-sm border ${
                isDarkMode
                  ? 'bg-gray-700/50 border-gray-600/50 text-white'
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              }`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>All</option>
            </select>

            <button
              onClick={clearFilters}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
              }`}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-6 ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {statistics.period} Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8M3 17h6m0 0V9m0 8l8-8" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Profit</p>
                <div className="flex flex-col space-y-1">
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {formatCurrencyWithUSD((statistics.totalProfit || 0) * 89).inr}
                  </p>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-green-300' : 'text-green-500'}`}>
                    ${statistics.totalProfit?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17H3m0 0v-8m0 8l8-8m18 6h-6m0 0V7m0 8l-8-8" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Loss</p>
                <div className="flex flex-col space-y-1">
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    {formatCurrencyWithUSD(Math.abs(statistics.totalLoss || 0) * 89).inr}
                  </p>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-red-300' : 'text-red-500'}`}>
                    ${Math.abs(statistics.totalLoss || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>


            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Daily P&L</p>
                <div className="flex flex-col space-y-1">
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrencyWithUSD((parseFloat(statistics.averageDailyPnL || '0') * 89)).inr}
                  </p>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    ${statistics.averageDailyPnL || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-500 to-orange-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Days Traded</p>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {statistics.daysTraded || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Table */}
      <div className={`flex-1 rounded-2xl backdrop-blur-lg border overflow-hidden flex flex-col min-h-0 ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No P&L records found
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Click "Add Today's P&L" to create your first record
            </p>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="overflow-auto flex-1 max-h-96">
              <table className="w-full">
                <thead className={`sticky top-0 ${isDarkMode ? 'bg-gray-700/90' : 'bg-gray-100/90'} backdrop-blur-sm`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Symbol</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Time</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>P&L</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Trades</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Notes</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {items.map((item) => (
                    <tr key={item.id} className={`${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.symbol || '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                        item.netPnL >= 0
                          ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                          : (isDarkMode ? 'text-red-400' : 'text-red-600')
                      }`}>
                        {item.netPnL >= 0 ? '+' : ''}${item.netPnL.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.totalTrades || 0}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="truncate block max-w-xs" title={item.notes}>
                          {item.notes || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              isDarkMode
                                ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              isDarkMode
                                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className={`sticky bottom-0 ${isDarkMode ? 'bg-gray-800/90' : 'bg-gray-100/90'} backdrop-blur-sm font-bold border-t-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <tr>
                    <td className={`px-6 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      TOTAL
                    </td>
                    <td></td>
                    <td></td>
                    <td className={`px-6 py-3 text-sm ${
                      totals.netPnL >= 0
                        ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                        : (isDarkMode ? 'text-red-400' : 'text-red-600')
                    }`}>
                      {totals.netPnL >= 0 ? '+' : ''}${totals.netPnL.toFixed(2)}
                    </td>
                    <td className={`px-6 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {totals.trades}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className={`flex justify-between items-center mt-6 p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'
              }`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100'
                    }`}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNumber = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                    if (pageNumber > pagination.totalPages) return null;

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-blue-500 text-white'
                            : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Right Sidebar - 25% on desktop, full width below main content on mobile */}
    <div className="w-full lg:w-1/4 lg:min-w-0 space-y-6">
      {/* Performance Metrics */}
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
                const totalAmount = calculateDepositTotal() + calculateWithdrawalTotal() + (totals.profit * 89) + (Math.abs(totals.loss) * 89);
                if (totalAmount === 0) return null;

                const depositPercent = (calculateDepositTotal() / totalAmount) * 100;
                const withdrawalPercent = (calculateWithdrawalTotal() / totalAmount) * 100;
                const profitPercent = ((totals.profit * 89) / totalAmount) * 100;
                const lossPercent = ((Math.abs(totals.loss) * 89) / totalAmount) * 100;

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
                    {hoveredSegment === 'deposits' ? formatCurrencyWithUSD(calculateDepositTotal()).inr :
                     hoveredSegment === 'withdrawals' ? formatCurrencyWithUSD(calculateWithdrawalTotal()).inr :
                     hoveredSegment === 'profit' ? formatCurrencyWithUSD(totals.profit * 89).inr :
                     formatCurrencyWithUSD(Math.abs(totals.loss) * 89).inr}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    {hoveredSegment === 'deposits' ? formatCurrencyWithUSD(calculateDepositTotal()).usd :
                     hoveredSegment === 'withdrawals' ? formatCurrencyWithUSD(calculateWithdrawalTotal()).usd :
                     hoveredSegment === 'profit' ? formatCurrencyWithUSD(totals.profit * 89).usd :
                     formatCurrencyWithUSD(Math.abs(totals.loss) * 89).usd}
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
                      const totalAmount = calculateDepositTotal() + calculateWithdrawalTotal() + (totals.profit * 89) + (Math.abs(totals.loss) * 89);
                      const amount = hoveredSegment === 'deposits' ? calculateDepositTotal() :
                                   hoveredSegment === 'withdrawals' ? calculateWithdrawalTotal() :
                                   hoveredSegment === 'profit' ? (totals.profit * 89) :
                                   (Math.abs(totals.loss) * 89);
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

            {/* Profit */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Profit</p>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'} truncate`}>
                  {formatCurrencyWithUSD(totals.profit * 89).inr}
                </p>
              </div>
            </div>

            {/* Loss */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loss</p>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'} truncate`}>
                  {formatCurrencyWithUSD(Math.abs(totals.loss) * 89).inr}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    </div>
  );

  return (
    <div className={`h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} overflow-y-auto`}>
      {content}

      {/* Add Modal */}
      {showAddModal && (
        <AddTradePnLModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          isDarkMode={isDarkMode}
          onSave={async (data) => {
            try {
              await dispatch(createTradePnL(data)).unwrap();
              toast.success('P&L record added successfully');
              setShowAddModal(false);
            } catch (error) {
              toast.error('Failed to add P&L record');
            }
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <EditTradePnLModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          isDarkMode={isDarkMode}
          item={editingItem}
          onSave={async (data) => {
            try {
              await dispatch(updateTradePnL({ id: editingItem.id, patch: data })).unwrap();
              toast.success('P&L record updated successfully');
              setShowEditModal(false);
              setEditingItem(null);
            } catch (error) {
              toast.error('Failed to update P&L record');
            }
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportTradePnLModal
          open={showImportModal}
          isDarkMode={isDarkMode}
          onClose={() => setShowImportModal(false)}
          onImported={async () => {
            await dispatch(fetchTradePnL(parseInt(filters.dataFilter)));
            await dispatch(fetchTradePnLStatistics(parseInt(filters.dataFilter)));
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <ConfirmModal
          open={!!deleteConfirmId}
          title="Delete P&L Record"
          message="Are you sure you want to delete this P&L record? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => handleDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
});

export default TradePnL;
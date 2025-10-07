import { memo, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSettings } from '../../contexts/settingsContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import {
  fetchTradingPnL,
  createTradingPnL,
  updateTradingPnL,
  deleteTradingPnL,
  fetchDailySummary,
  fetchTradingWallets,
  createTradingWallet,
  updateTradingWallet,
  deleteTradingWallet,
  fetchWalletBalance,
} from '../../redux/thunks/trading/tradingThunks';
import type { TradingPnL, TradingWallet } from '../../types/trading';

// Helper function to get local date in YYYY-MM-DD format
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Trading = memo(function Trading() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const dispatch = useDispatch<AppDispatch>();

  const {
    pnlList,
    wallets,
    dailySummary,
    walletBalance,
    loading,
    error,
  } = useSelector((state: RootState) => state.trading);

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [userFilter, setUserFilter] = useState<string>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>(getLocalDateString());

  // P&L Form State
  const [showPnLModal, setShowPnLModal] = useState(false);
  const [editPnLId, setEditPnLId] = useState<string | null>(null);

  // Common fields for all entries
  const [commonFields, setCommonFields] = useState({
    symbol: 'XAUUSD',
    date: getLocalDateString(),
    notes: '',
  });

  // Multiple P&L amounts
  const [pnlAmounts, setPnlAmounts] = useState([0]);

  const symbolOptions = ['XAUUSD', 'BTCUSD', 'ETHUSD'];

  // For edit mode, use single entry
  const [pnlFormData, setPnlFormData] = useState({
    symbol: 'XAUUSD',
    pnl: 0,
    date: getLocalDateString(),
    notes: '',
  });

  // Wallet Form State
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [editWalletId, setEditWalletId] = useState<string | null>(null);
  const [walletFormData, setWalletFormData] = useState({
    name: '',
    balance: 0,
    currency: 'USD',
    platform: '',
    notes: '',
  });

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

  // Load data based on selected date
  useEffect(() => {
    dispatch(fetchTradingPnL(dateFilter));
    dispatch(fetchTradingWallets());
    dispatch(fetchWalletBalance());
    if (selectedDate) {
      dispatch(fetchDailySummary(selectedDate));
    }
  }, [dispatch, dateFilter, selectedDate]);

  // Get unique users and symbols
  const uniqueUsers = Array.from(new Set(pnlList.map(p => p.userName)));
  const uniqueSymbols = Array.from(new Set(pnlList.map(p => p.symbol)));

  // Filter P&L by user, symbol, and search query (date filtering is done on backend)
  const filteredPnL = pnlList.filter(p => {
    // User filter
    if (userFilter !== 'all' && p.userName !== userFilter) return false;

    // Symbol filter
    if (symbolFilter !== 'all' && p.symbol !== symbolFilter) return false;

    // Search query (searches in user, symbol, pnl, notes)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesUser = p.userName.toLowerCase().includes(query);
      const matchesSymbol = p.symbol.toLowerCase().includes(query);
      const matchesPnl = p.pnl.toString().includes(query);
      const matchesNotes = p.notes?.toLowerCase().includes(query) || false;

      if (!matchesUser && !matchesSymbol && !matchesPnl && !matchesNotes) return false;
    }

    return true;
  });

  // Calculate filtered summary based on user filter
  const filteredSummary = {
    totalPnL: filteredPnL.reduce((sum, p) => sum + p.pnl, 0),
    totalProfit: filteredPnL.reduce((sum, p) => sum + (p.pnl > 0 ? p.pnl : 0), 0),
    totalLoss: filteredPnL.reduce((sum, p) => sum + (p.pnl < 0 ? Math.abs(p.pnl) : 0), 0),
    tradesCount: filteredPnL.length,
  };

  // Handle P&L Submit
  const handlePnLSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editPnLId) {
        // Edit mode - single entry
        await dispatch(updateTradingPnL({ id: editPnLId, data: pnlFormData })).unwrap();
        toast.success('P&L updated successfully');
      } else {
        // Create mode - multiple entries with same common fields
        for (const pnl of pnlAmounts) {
          const entry = {
            ...commonFields,
            pnl: pnl,
          };
          await dispatch(createTradingPnL(entry)).unwrap();
        }
        toast.success(`${pnlAmounts.length} P&L ${pnlAmounts.length > 1 ? 'entries' : 'entry'} created successfully`);
      }
      setShowPnLModal(false);
      setEditPnLId(null);
      setPnlFormData({
        symbol: 'XAUUSD',
        pnl: 0,
        date: getLocalDateString(),
        notes: '',
      });
      setCommonFields({
        symbol: 'XAUUSD',
        date: getLocalDateString(),
        notes: '',
      });
      setPnlAmounts([0]);
      dispatch(fetchTradingPnL(dateFilter));
      dispatch(fetchDailySummary(selectedDate));
    } catch (err: any) {
      toast.error(err || 'Failed to save P&L entry');
    }
  };

  // Add new P&L amount row
  const handleAddPnLRow = () => {
    setPnlAmounts([...pnlAmounts, 0]);
  };

  // Remove P&L amount row
  const handleRemovePnLRow = (index: number) => {
    if (pnlAmounts.length > 1) {
      setPnlAmounts(pnlAmounts.filter((_, i) => i !== index));
    }
  };

  // Update specific P&L amount
  const handleUpdatePnLAmount = (index: number, value: number) => {
    const updated = [...pnlAmounts];
    updated[index] = value;
    setPnlAmounts(updated);
  };

  // Handle Wallet Submit
  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editWalletId) {
        await dispatch(updateTradingWallet({ id: editWalletId, data: walletFormData })).unwrap();
        toast.success('Wallet updated successfully');
      } else {
        await dispatch(createTradingWallet(walletFormData)).unwrap();
        toast.success('Wallet created successfully');
      }
      setShowWalletModal(false);
      setEditWalletId(null);
      setWalletFormData({
        name: '',
        balance: 0,
        currency: 'USD',
        platform: '',
        notes: '',
      });
      dispatch(fetchTradingWallets());
      dispatch(fetchWalletBalance());
    } catch (err: any) {
      toast.error(err || 'Failed to save wallet');
    }
  };

  // Handle Delete P&L
  const handleDeletePnL = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this P&L entry?')) {
      try {
        await dispatch(deleteTradingPnL(id)).unwrap();
        toast.success('P&L entry deleted');
        dispatch(fetchDailySummary(selectedDate));
      } catch (err: any) {
        toast.error(err || 'Failed to delete P&L entry');
      }
    }
  };

  // Handle Delete Wallet
  const handleDeleteWallet = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this wallet?')) {
      try {
        await dispatch(deleteTradingWallet(id)).unwrap();
        toast.success('Wallet deleted');
        dispatch(fetchWalletBalance());
      } catch (err: any) {
        toast.error(err || 'Failed to delete wallet');
      }
    }
  };

  // Open Edit Modal
  const openEditPnL = (pnl: TradingPnL) => {
    setEditPnLId(pnl.id);
    setPnlFormData({
      symbol: pnl.symbol,
      pnl: pnl.pnl,
      date: pnl.date,
      notes: pnl.notes || '',
    });
    setShowPnLModal(true);
  };

  const openEditWallet = (wallet: TradingWallet) => {
    setEditWalletId(wallet.id);
    setWalletFormData({
      name: wallet.name,
      balance: wallet.balance,
      currency: wallet.currency,
      platform: wallet.platform || '',
      notes: wallet.notes || '',
    });
    setShowWalletModal(true);
  };

  const isDarkMode = settings.theme === 'dark';

  return (
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
              Trading
            </h1>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Track your daily trades and P&L performance
            </p>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className={`p-4 sm:p-6 rounded-2xl backdrop-blur-lg border mb-6 ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Daily Summary
          </h3>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg text-sm ${
              isDarkMode
                ? 'bg-gray-700 text-white border border-gray-600'
                : 'bg-white text-gray-900 border border-gray-300'
            } w-full sm:w-auto max-w-[200px]`}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
            isDarkMode ? 'bg-gray-700/30 border-gray-600/50' : 'bg-white/60 border-white/30'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                filteredSummary.totalPnL >= 0
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                  : 'bg-gradient-to-br from-red-500 to-rose-500'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total P&L</p>
                <p className={`text-2xl font-bold ${filteredSummary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${filteredSummary.totalPnL.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
            isDarkMode ? 'bg-gray-700/30 border-gray-600/50' : 'bg-white/60 border-white/30'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M trending-up" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Profit</p>
                <p className="text-2xl font-bold text-green-400">
                  ${filteredSummary.totalProfit.toLocaleString()}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Loss</p>
                <p className="text-2xl font-bold text-red-400">
                  ${filteredSummary.totalLoss.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
            isDarkMode ? 'bg-gray-700/30 border-gray-600/50' : 'bg-white/60 border-white/30'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Trades Count</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {filteredSummary.tradesCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 70/30 Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Section - 70% */}
        <div className="xl:col-span-8 space-y-4 sm:space-y-6">
          {/* P&L Section */}
          <div className={`p-4 sm:p-6 rounded-2xl backdrop-blur-lg border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
          }`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Trades for {new Date(dateFilter).toLocaleDateString()}
              </h2>
              <button
                onClick={() => {
                  setEditPnLId(null);
                  setCommonFields({
                    symbol: 'XAUUSD',
                    date: getLocalDateString(),
                    notes: '',
                  });
                  setPnlAmounts([0]);
                  setShowPnLModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Trade</span>
                </div>
              </button>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              {/* Search Box */}
              <input
                type="text"
                placeholder="Search by user, symbol, P&L, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-white text-gray-900 border border-gray-300'
                }`}
              />

              {/* User Filter */}
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg w-full sm:w-auto ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-white text-gray-900 border border-gray-300'
                }`}
              >
                <option value="all">All Users</option>
                {uniqueUsers.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>

              {/* Symbol Filter */}
              <select
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg w-full sm:w-auto ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-white text-gray-900 border border-gray-300'
                }`}
              >
                <option value="all">All Symbols</option>
                {uniqueSymbols.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>

              {/* Clear Filters Button */}
              {(searchQuery || userFilter !== 'all' || symbolFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setUserFilter('all');
                    setSymbolFilter('all');
                  }}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    isDarkMode
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* P&L List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}>
                  <tr>
                    <th className={`p-3 text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                    <th className={`p-3 text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>User</th>
                    <th className={`p-3 text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Symbol</th>
                    <th className={`p-3 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>P&L</th>
                    <th className={`p-3 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPnL.map((pnl) => (
                    <tr key={pnl.id} className={`border-b ${
                      isDarkMode
                        ? 'border-gray-700 hover:bg-gray-700/30'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <td className={`p-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(pnl.date).toLocaleDateString()}
                      </td>
                      <td className={`p-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {pnl.userName}
                      </td>
                      <td className={`p-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {pnl.symbol}
                      </td>
                      <td className={`p-3 text-right font-bold ${pnl.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${pnl.pnl.toLocaleString()}
                      </td>
                      <td className="p-3 text-center space-x-2">
                        {currentUser && (pnl.userName === currentUser.name || pnl.userName === currentUser.email) ? (
                          <>
                            <button
                              onClick={() => openEditPnL(pnl)}
                              className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-lg text-sm text-white transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePnL(pnl.id)}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm text-white transition-all"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            View Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPnL.length === 0 && (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No trades found for {new Date(dateFilter).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - 30% */}
        <div className="xl:col-span-4 space-y-4 sm:space-y-6">
          {/* Wallet Balance */}
          <div className={`p-4 sm:p-6 rounded-2xl backdrop-blur-lg border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Wallet Balance
            </h2>
            {walletBalance && (
              <div className="bg-gray-700 p-4 rounded mb-4">
                <p className="text-gray-400 text-sm">Total Balance</p>
                <p className="text-2xl font-bold text-green-400">
                  ${walletBalance.totalBalance.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Wallets Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Wallets</h2>
              <button
                onClick={() => {
                  setEditWalletId(null);
                  setWalletFormData({
                    name: '',
                    balance: 0,
                    currency: 'USD',
                    platform: '',
                    notes: '',
                  });
                  setShowWalletModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="bg-gray-700 p-4 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{wallet.name}</p>
                      <p className="text-sm text-gray-400">{wallet.platform}</p>
                    </div>
                    <p className="font-bold text-green-400">
                      {wallet.balance.toLocaleString()} {wallet.currency}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openEditWallet(wallet)}
                      className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteWallet(wallet.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {wallets.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">No wallets found</div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-2">
              {pnlList.slice(0, 5).map((pnl) => (
                <div key={pnl.id} className="bg-gray-700 p-3 rounded text-sm">
                  <div className="flex justify-between">
                    <span>{pnl.symbol}</span>
                    <span className={pnl.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ${pnl.pnl.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {pnl.userName} • {new Date(pnl.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* P&L Modal */}
      {showPnLModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editPnLId ? 'Edit P&L Entry' : 'Add P&L Entries'}
              </h2>
              {!editPnLId && (
                <button
                  type="button"
                  onClick={handleAddPnLRow}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                >
                  <span>+</span> Add Row
                </button>
              )}
            </div>
            <form onSubmit={handlePnLSubmit}>
              {editPnLId ? (
                // Edit mode - single entry
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">Symbol</label>
                    <select
                      value={pnlFormData.symbol}
                      onChange={(e) => setPnlFormData({ ...pnlFormData, symbol: e.target.value })}
                      className="w-full bg-gray-700 px-4 py-2 rounded"
                      required
                    >
                      {symbolOptions.map((symbol) => (
                        <option key={symbol} value={symbol}>
                          {symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">P&L</label>
                    <input
                      type="number"
                      step="any"
                      value={pnlFormData.pnl}
                      onChange={(e) => setPnlFormData({ ...pnlFormData, pnl: parseFloat(e.target.value) })}
                      className="w-full bg-gray-700 px-4 py-2 rounded"
                      placeholder="Enter P&L amount (positive or negative)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Date</label>
                    <input
                      type="date"
                      value={pnlFormData.date}
                      onChange={(e) => setPnlFormData({ ...pnlFormData, date: e.target.value })}
                      className="w-full bg-gray-700 px-4 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Notes</label>
                    <textarea
                      value={pnlFormData.notes}
                      onChange={(e) => setPnlFormData({ ...pnlFormData, notes: e.target.value })}
                      className="w-full bg-gray-700 px-4 py-2 rounded"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                // Create mode - common fields + multiple P&L amounts
                <div className="space-y-4">
                  {/* Common Fields */}
                  <div className="bg-gray-700 p-4 rounded-lg space-y-3">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Common Fields</h3>
                    <div>
                      <label className="block text-sm mb-1">Symbol</label>
                      <select
                        value={commonFields.symbol}
                        onChange={(e) => setCommonFields({ ...commonFields, symbol: e.target.value })}
                        className="w-full bg-gray-600 px-3 py-2 rounded text-sm"
                        required
                      >
                        {symbolOptions.map((symbol) => (
                          <option key={symbol} value={symbol}>
                            {symbol}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Date</label>
                      <input
                        type="date"
                        value={commonFields.date}
                        onChange={(e) => setCommonFields({ ...commonFields, date: e.target.value })}
                        className="w-full bg-gray-600 px-3 py-2 rounded text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Notes</label>
                      <textarea
                        value={commonFields.notes}
                        onChange={(e) => setCommonFields({ ...commonFields, notes: e.target.value })}
                        className="w-full bg-gray-600 px-3 py-2 rounded text-sm"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* P&L Amounts */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-300">P&L Amounts</h3>
                    {pnlAmounts.map((amount, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="number"
                          step="any"
                          value={amount}
                          onChange={(e) => handleUpdatePnLAmount(index, parseFloat(e.target.value) || 0)}
                          className="flex-1 bg-gray-700 px-3 py-2 rounded text-sm"
                          placeholder="Enter P&L amount (positive or negative)"
                          required
                        />
                        {pnlAmounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePnLRow(index)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-2 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  {editPnLId ? 'Update' : `Create ${pnlAmounts.length} ${pnlAmounts.length > 1 ? 'Entries' : 'Entry'}`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPnLModal(false);
                    setEditPnLId(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editWalletId ? 'Edit Wallet' : 'Add Wallet'}
            </h2>
            <form onSubmit={handleWalletSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <input
                    type="text"
                    value={walletFormData.name}
                    onChange={(e) => setWalletFormData({ ...walletFormData, name: e.target.value })}
                    className="w-full bg-gray-700 px-4 py-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Balance</label>
                  <input
                    type="number"
                    value={walletFormData.balance}
                    onChange={(e) => setWalletFormData({ ...walletFormData, balance: parseFloat(e.target.value) })}
                    className="w-full bg-gray-700 px-4 py-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Currency</label>
                  <input
                    type="text"
                    value={walletFormData.currency}
                    onChange={(e) => setWalletFormData({ ...walletFormData, currency: e.target.value })}
                    className="w-full bg-gray-700 px-4 py-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Platform</label>
                  <input
                    type="text"
                    value={walletFormData.platform}
                    onChange={(e) => setWalletFormData({ ...walletFormData, platform: e.target.value })}
                    className="w-full bg-gray-700 px-4 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Notes</label>
                  <textarea
                    value={walletFormData.notes}
                    onChange={(e) => setWalletFormData({ ...walletFormData, notes: e.target.value })}
                    className="w-full bg-gray-700 px-4 py-2 rounded"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  {editWalletId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWalletModal(false);
                    setEditWalletId(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default Trading;

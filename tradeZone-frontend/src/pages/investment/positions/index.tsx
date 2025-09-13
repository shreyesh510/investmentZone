import React, { memo, useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useSettings } from '../../../contexts/settingsContext';
import { useNavigate } from 'react-router-dom';
import Header from '../../../layouts/header';
import Sidebar from '../../../layouts/sidebar';
import FloatingButton, { type MobileTab } from '../../../components/button/floatingButton';
import { usePermissions } from '../../../hooks/usePermissions';
import type { RootState, AppDispatch } from '../../../redux/store';
import { fetchPositions, createPosition, updatePosition } from '../../../redux/thunks/positions/positionsThunks';
import { clearError } from '../../../redux/slices/positionsSlice';
import type { Position, PositionLike, AggregatedPosition, CreatePositionData } from '../../../types/position';
import Input from '../../../components/input';
import Select from '../../../components/select';
import Radio from '../../../components/radio';
import RoundedButton from '../../../components/button/RoundedButton';
// Removed ProgressBar in favor of a dropdown for leverage selection
import { ModifyPositionModal, ClosePositionModal } from './components';
import { ImportPositionsModal } from './components/modal';
import { positionsApi } from '../../../services/positionsApi';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

interface PositionForm {
  symbol: string;
  lots: string;
  marginAmount: string; // replaces entryPrice; used as investedAmount
  side: 'buy' | 'sell';
  platform: 'Delta Exchange' | 'Groww';
  account: 'longterm' | 'main';
}

const Positions = memo(function Positions() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showImport, setShowImport] = useState<boolean>(false);
  // Close modal state
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [closingOne, setClosingOne] = useState<boolean>(false);
  const [selectedForClose, setSelectedForClose] = useState<Position | null>(null);

  // Modify modal state
  const [showModifyModal, setShowModifyModal] = useState<boolean>(false);
  const [selectedForModify, setSelectedForModify] = useState<Position | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState({
    timeframe: 'all',
    side: 'all' as 'all' | 'buy' | 'sell',
    account: 'longterm' as 'all' | 'main' | 'longterm',
    platform: 'Delta Exchange' as 'all' | 'Delta Exchange' | 'Groww',
  });
  const [search, setSearch] = useState<string>('');

  // Redux state
  const { positions, loading, createLoading, updateLoading, error } = useSelector((state: RootState) => state.positions);

  // Redirect if no permission
  useEffect(() => {
    if (!canAccessInvestment()) {
      navigate('/zone');
    }
  }, [canAccessInvestment, navigate]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch positions from API based on filters (server-side filtering)
  useEffect(() => {
    const f: any = {};
    f.status = 'open';
    if (filters.side !== 'all') f.side = filters.side;
    if (filters.platform !== 'all') f.platform = filters.platform;
    if (filters.account !== 'all') f.account = filters.account;
    f.timeframe = filters.timeframe;
    dispatch(fetchPositions(f));
  }, [dispatch, filters]);

  // Fetch recent activity
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setActivityLoading(true);
        const items = await positionsApi.getHistory(12);
        if (mounted) setActivity(items || []);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setActivityLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const handleTabChange = (tab: MobileTab) => setActiveTab(tab);
  const isDarkMode = settings.theme === 'dark';

  // Amounts are already USD; display as-is

  // Show unique symbols only (keep the most recent position per symbol)
  const uniquePositions: PositionLike[] = (() => {
    const bySymbol = new Map<string, Position>();
    const toEpoch = (p: Position): number => {
      const t1 = p.createdAt ? new Date(p.createdAt).getTime() : NaN;
      const t2 = p.updatedAt ? new Date(p.updatedAt).getTime() : NaN;
      const t3 = p.timestamp ? Date.parse(p.timestamp) : NaN;
      return Math.max(Number.isFinite(t1) ? t1 : 0, Number.isFinite(t2) ? t2 : 0, Number.isFinite(t3) ? t3 : 0);
    };
    const looksAggregated = positions.every((p: any) => !('id' in p) && 'pnl' in p && !('entryPrice' in p));
    if (looksAggregated) return positions as AggregatedPosition[];
    (positions as Position[]).forEach((p) => {
      const key = p.symbol.toUpperCase();
      const existing = bySymbol.get(key);
      if (!existing) {
        bySymbol.set(key, p);
        return;
      }
      if (toEpoch(p) >= toEpoch(existing)) bySymbol.set(key, p);
    });
    return Array.from(bySymbol.values());
  })();

  // Form state
  const [positionForm, setPositionForm] = useState<PositionForm>({
    symbol: '',
    lots: '',
  marginAmount: '',
    side: 'buy',
    platform: 'Delta Exchange',
    account: 'longterm',
  });
  // NOTE: Symbol is now a free-text field (Investment Name)

  // Handle form input changes
  const handleFormChange = (field: keyof PositionForm, value: string) => {
    setPositionForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionForm.symbol || !positionForm.lots || !positionForm.marginAmount) {
      toast.warning('Please fill all required fields');
      return;
    }
    const lotsNum = parseInt(String(positionForm.lots).replace(/[\,\s]/g, ''));
    const marginNum = parseFloat(String(positionForm.marginAmount).replace(/[\,\s]/g, ''));
    if (!Number.isFinite(lotsNum) || lotsNum <= 0) {
      toast.warning('Lots must be a positive number');
      return;
    }
    if (!Number.isFinite(marginNum) || marginNum <= 0) {
      toast.warning('Margin amount must be a positive number');
      return;
    }
    // Derive entryPrice from margin to satisfy backend DTO (entryPrice required)
    const derivedEntry = marginNum / lotsNum;
    const newPositionData: CreatePositionData = {
      symbol: positionForm.symbol.toUpperCase(),
      side: positionForm.side,
      entryPrice: Number.isFinite(derivedEntry) && derivedEntry > 0 ? derivedEntry : 1,
      lots: parseInt(positionForm.lots),
      investedAmount: marginNum,
      platform: positionForm.platform,
  leverage: undefined, // backend ignores it now
  account: positionForm.account,
      timestamp: new Date().toLocaleString(),
    };
    try {
      await dispatch(createPosition(newPositionData)).unwrap();
      setPositionForm({ symbol: '', lots: '', marginAmount: '', side: 'buy', platform: 'Delta Exchange', account: 'main' });
      setShowAddForm(false);
      toast.success('Position added successfully!');
    } catch (error) {
      console.error('Failed to create position:', error);
      toast.error('Failed to add position. Please try again.');
    }
  };

  // Error clear
  const handleClearError = () => dispatch(clearError());

  // Open close modal for a given position (only if it has an ID)
  const openCloseModal = (position: PositionLike) => {
    if ('id' in position) {
      setSelectedForClose(position as Position);
      setClosePnL('');
      setShowCloseModal(true);
    } else {
      toast.info('Open the symbol detail to close specific legs, or use Close All.');
      setSelectedForClose(null);
      setClosePnL('');
      setShowCloseModal(true);
    }
  };

  const handleClosePosition = async (id: string, pnl?: number) => {
    try {
      setClosingOne(true);
      await dispatch(
        updatePosition({
          id,
          data: { status: 'closed', pnl: Number.isFinite(pnl) ? pnl : 0, closedAt: new Date() as any },
        })
      ).unwrap();
      toast.success('Position closed');
      setShowCloseModal(false);
      setSelectedForClose(null);
    } catch (err) {
      toast.error('Failed to close position');
    } finally {
      setClosingOne(false);
    }
  };

  const handleModifyPosition = (position: Position) => {
    setSelectedForModify(position);
    setShowModifyModal(true);
  };

  const handleSaveModification = async (id: string, data: any) => {
    try {
      await dispatch(updatePosition({ id, data })).unwrap();
      toast.success('Position updated successfully');
      setShowModifyModal(false);
      setSelectedForModify(null);
      // Removed fetchPositions call - Redux state is already updated by updatePosition.fulfilled
    } catch (error) {
      console.error('Error updating position:', error);
      toast.error('Failed to update position');
    }
  };

  // Filter functions
  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Server applies most filters; apply client-side search by name (symbol) for partial matches
  const filteredPositions = useMemo(() => {
    const q = (search || '').trim().toUpperCase();
    if (!q) return uniquePositions;
    return uniquePositions.filter((p: any) => (p.symbol || '').toUpperCase().includes(q));
  }, [uniquePositions, search]);

  const content = (
    <div className={`flex-1 p-6 overflow-y-auto ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <p>Error: {error}</p>
            <button onClick={handleClearError} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Clear</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Positions</h1>
          <div className="flex space-x-3">
            {/* Import File Button */}
            <RoundedButton
              onClick={() => setShowImport(true)}
              variant="purple"
              isDarkMode={isDarkMode}
            >
              Import File
            </RoundedButton>
            {/* Add Position Button */}
            <RoundedButton
              onClick={() => setShowAddForm(!showAddForm)}
              variant="primary"
              isDarkMode={isDarkMode}
              isActive={showAddForm}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {showAddForm ? 'Cancel' : 'Add Position'}
            </RoundedButton>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`p-5 rounded-2xl backdrop-blur-lg border mb-6 ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}
      >
        <div className="flex flex-wrap gap-5 items-center">
          <h3 className={`text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Filters:
          </h3>
          
          {/* Timeframe Filter */}
          <div className="flex items-center space-x-3">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Timeframe:
            </label>
            <select
              value={filters.timeframe}
              onChange={(e) => handleFilterChange('timeframe', e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              <option value="1D">1 Day</option>
              <option value="7D">7 Days</option>
              <option value="30D">30 Days</option>
              <option value="90D">90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Side Filter */}
          <div className="flex items-center space-x-3">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Side:
            </label>
            <select
              value={filters.side}
              onChange={(e) => handleFilterChange('side', e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              <option value="all">All</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center space-x-3">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Platform:
            </label>
            <select
              value={filters.platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              <option value="Delta Exchange">Delta Exchange</option>
              <option value="Groww">Groww</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Account Filter */}
          <div className="flex items-center space-x-3">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Account:
            </label>
            <select
              value={filters.account}
              onChange={(e) => handleFilterChange('account', e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              <option value="all">All</option>
              <option value="main">Main</option>
              <option value="longterm">Longterm</option>
            </select>
          </div>

          {/* Search by Name */}
          <div className="flex items-center space-x-3">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Search:
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name"
              className={`px-4 py-2 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'}`}
            />
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={() => { setFilters({ timeframe: 'all', side: 'all', account: 'longterm', platform: 'Delta Exchange' }); setSearch(''); }}
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

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - 75% - Current Functionality */}
        <div className="flex-1 lg:w-3/4">

      {/* Investment Summary */}
      <div
        className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}
      >
        <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Statistics Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Symbols */}
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Symbols</h3>
              <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{filteredPositions.length}</p>
            </div>
          </div>

          {/* Total Investment */}
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Investment</h3>
              <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${filteredPositions.reduce((s: number, p: any) => s + (p.investedAmount || 0), 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Total P&L */}
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${
              filteredPositions.reduce((s: number, p: any) => s + (p.pnl || 0), 0) >= 0 
                ? 'from-green-500 to-emerald-500' 
                : 'from-red-500 to-rose-500'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {filteredPositions.reduce((s: number, p: any) => s + (p.pnl || 0), 0) >= 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                )}
              </svg>
            </div>
            <div>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total P&L</h3>
              <p className={`text-xl font-semibold ${
                filteredPositions.reduce((s: number, p: any) => s + (p.pnl || 0), 0) >= 0 
                  ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                  : (isDarkMode ? 'text-red-400' : 'text-red-600')
              }`}>
                {filteredPositions.reduce((s: number, p: any) => s + (p.pnl || 0), 0) >= 0 ? '+' : ''}${filteredPositions.reduce((s: number, p: any) => s + (p.pnl || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Position Form */}
      {showAddForm && (
        <div
          className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
          }`}
        >
          <h2 className="text-lg font-semibold mb-4">Add New Position</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {/* Platform Selection */}
            <Select
              value={positionForm.platform}
              onChange={(value) => handleFormChange('platform', value)}
              options={[
                { value: 'Delta Exchange', label: 'Delta Exchange' },
                { value: 'Groww', label: 'Groww' },
              ]}
              label="Platform"
              isDarkMode={isDarkMode}
            />

            {/* Investment Name (replaces Symbol dropdown) */}
            <Input
              type="text"
              value={positionForm.symbol}
              onChange={(value) => handleFormChange('symbol', value)}
              placeholder="Enter investment name"
              label="Investment Name"
              required
              isDarkMode={isDarkMode}
            />

            {/* Lots */}
            <Input
              type="number"
              value={positionForm.lots}
              onChange={(value) => handleFormChange('lots', value)}
              placeholder="Enter lots"
              label="Lots"
              min={1}
              required
              isDarkMode={isDarkMode}
            />

            {/* Margin Amount */}
            <Input
              type="number"
              value={positionForm.marginAmount}
              onChange={(value) => handleFormChange('marginAmount', value)}
              placeholder="Enter margin amount"
              label="Margin Amount"
              step="any"
              required
              isDarkMode={isDarkMode}
            />

            {/* Side */}
            <Radio
              value={positionForm.side}
              onChange={(value) => handleFormChange('side', value)}
              options={[
                { value: 'buy', label: 'Buy' },
                { value: 'sell', label: 'Sell' },
              ]}
              label="Side"
              isDarkMode={isDarkMode}
            />

            {/* Account */}
            <Radio
              value={positionForm.account}
              onChange={(value) => handleFormChange('account', value)}
              options={[
                { value: 'main', label: 'Main' },
                { value: 'longterm', label: 'Longterm' },
              ]}
              label="Account"
              isDarkMode={isDarkMode}
            />

            {/* Submit */}
            <div className="md:col-span-2 lg:col-span-6 flex gap-4">
              <button
                type="submit"
                disabled={createLoading}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? 'Adding...' : 'Add Position'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className={`px-8 py-3 font-medium rounded-xl transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading positions...</p>
        </div>
      )}

      {/* Positions Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPositions.map((position: any) => {
            return (
              <div
                key={(position as any).id ?? (position as any).symbol}
                className={`p-5 rounded-lg border transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {position.symbol}
                    </h3>
                    {'platform' in position && (
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(position as Position).platform}
                      </p>
                    )}
                  </div>

                  <div className={`text-sm font-medium px-2 py-1 rounded ${
                    position.side === 'buy' 
                      ? isDarkMode ? 'text-green-400' : 'text-green-600'
                      : isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {position.side.toUpperCase()}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Lots</span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {position.lots}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Invested</span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      ${Number(position.investedAmount || 0).toFixed(2)}
                    </span>
                  </div>

                  {'account' in position && (
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Account</span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {(position as any).account || 'main'}
                      </span>
                    </div>
                  )}

                  {'pnl' in position && position.pnl !== undefined && (
                    <div className={`flex justify-between items-center pt-2 mt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>P&L</span>
                      <span className={`text-sm font-semibold ${
                        position.pnl >= 0 
                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                          : isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {position.pnl >= 0 ? '+' : ''}${Number(position.pnl).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className={`flex space-x-2 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if ('id' in position) {
                        handleModifyPosition(position as Position);
                      } else {
                        toast.info('Cannot modify aggregated positions. Please view individual positions.');
                      }
                    }}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      isDarkMode 
                        ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Modify
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCloseModal(position);
                    }}
                    disabled={updateLoading}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                      isDarkMode 
                        ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {updateLoading ? 'Closing...' : 'Close'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>

        {/* Right Column - 25% - Recent Activity */}
        <div className="w-full lg:w-1/4">
          <div
            className={`p-6 rounded-2xl backdrop-blur-lg border ${
              isDarkMode ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Activity
            </h3>
            
            {/* Activity List - Scrollable with full screen height */}
            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              {activityLoading && (
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading activity…</p>
                </div>
              )}
              {!activityLoading && activity.length === 0 && (
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No recent activity</p>
                </div>
              )}
              {!activityLoading && activity.map((item, idx) => {
                const created = item.createdAt ? new Date(item.createdAt) : null;
                const minutesAgo = created ? Math.floor((Date.now() - created.getTime()) / 60000) : null;
                const timeLabel = minutesAgo === null
                  ? ''
                  : minutesAgo < 1
                  ? 'just now'
                  : minutesAgo < 60
                  ? `${minutesAgo} min ago`
                  : `${Math.floor(minutesAgo / 60)} hour${Math.floor(minutesAgo / 60) > 1 ? 's' : ''} ago`;

                const action = item.action as string;
                const titleColor = action === 'create'
                  ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                  : action === 'update'
                  ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                  : action === 'close' || action === 'close-all'
                  ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                  : (isDarkMode ? 'text-purple-400' : 'text-purple-600');

                const title = action === 'create'
                  ? 'Position Opened'
                  : action === 'update'
                  ? 'Position Modified'
                  : action === 'close'
                  ? 'Position Closed'
                  : action === 'close-all'
                  ? 'All Positions Closed'
                  : action === 'delete'
                  ? 'Position Deleted'
                  : action === 'bulk-create'
                  ? 'Positions Imported'
                  : 'Activity';

                const desc = (() => {
                  const sym = item.symbol || item.details?.symbol || '';
                  if (action === 'create') {
                    const lots = item.details?.lots;
                    const side = (item.details?.side || '').toUpperCase();
                    return `${sym} - ${side} ${lots ?? ''} ${lots ? 'lots' : ''}`.trim();
                  }
                  if (action === 'update') {
                    const fields = ['lots', 'entryPrice', 'investedAmount', 'status', 'pnl'];
                    const parts = fields
                      .filter((f) => item.details && item.details[f] !== undefined)
                      .map((f) => `${f}: ${item.details[f]}`);
                    return `${sym} - ${parts.join(', ')}` || sym;
                  }
                  if (action === 'close') {
                    const pnl = item.details?.pnl;
                    return `${sym} - Closed${pnl !== undefined ? ` with ${pnl >= 0 ? '+' : ''}$${Number(pnl).toFixed(2)} P&L` : ''}`;
                  }
                  if (action === 'close-all') {
                    const count = item.details?.count;
                    return `Closed ${count ?? 0} positions`;
                  }
                  if (action === 'delete') {
                    return `${sym} - Position removed`;
                  }
                  if (action === 'bulk-create') {
                    const createdCount = item.details?.created ?? 0;
                    const skipped = item.details?.skipped ?? 0;
                    return `Created ${createdCount} positions, skipped ${skipped}`;
                  }
                  return sym || 'Activity';
                })();

                return (
                  <div key={item.id || idx} className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'} min-h-[80px] max-h-[120px] flex flex-col justify-between`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${titleColor} truncate`}>
                        {title}
                      </span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-2 flex-shrink-0`}>
                        {timeLabel}
                      </span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-2 overflow-hidden`}>
                      {desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Optional: add controls here later (e.g., refresh) */}
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col fixed inset-0 overflow-hidden`}
        style={{ height: '100svh', minHeight: '100vh', maxHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, paddingBottom: '0px', margin: '0px' }}
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
      <Header onlineUsers={onlineUsers} sidebarOpen={sidebarOpen} onSidebarToggle={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex min-h-0 overflow-hidden">{content}</div>

      {/* Import Modal */}
      {showImport && (
        <ImportPositionsModal
          open={showImport}
          isDarkMode={isDarkMode}
          onClose={() => setShowImport(false)}
          onImported={async () => {
            const f: any = { status: 'open', timeframe: filters.timeframe };
            if (filters.side !== 'all') f.side = filters.side;
            if (filters.platform !== 'all') f.platform = filters.platform;
            if (filters.account !== 'all') f.account = filters.account;
            await dispatch(fetchPositions(f));
            try { setActivityLoading(true); const items = await positionsApi.getHistory(10); setActivity(items || []); } finally { setActivityLoading(false); }
          }}
        />
      )}

      {/* Close Position Modal */}
      <ClosePositionModal
        position={selectedForClose}
        isOpen={showCloseModal}
        onClose={() => {
          setShowCloseModal(false);
          setSelectedForClose(null);
        }}
        onConfirm={handleClosePosition}
        isDarkMode={isDarkMode}
      />

      {/* Modify Modal */}
      <ModifyPositionModal
        position={selectedForModify}
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        onSave={handleSaveModification}
        isDarkMode={isDarkMode}
      />
    </div>
  );
});

export default Positions;
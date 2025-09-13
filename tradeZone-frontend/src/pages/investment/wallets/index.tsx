import { memo, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Header from '../../../layouts/header';
import Sidebar from '../../../layouts/sidebar';
import { useSettings } from '../../../contexts/settingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../redux/store';
import { fetchWallets, createWallet, updateWallet, deleteWallet, fetchWalletHistory } from '../../../redux/thunks/wallets/walletsThunks';
import ConfirmModal from '../../../components/modal/confirmModal';
import { AddWalletModal, EditWalletModal } from './components/modal';
import RoundedButton from '../../../components/button/RoundedButton';

interface WalletCardProps {
  wallet: any;
  isDark: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet, isDark, onEdit, onDelete }) => {
  const isBank = wallet.type === 'bank' || (!wallet.type && /bank/i.test(wallet.platform || ''));
  const isDemat = !isBank;
  
  const getWalletIcon = () => {
    if (isBank) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getGradientClass = () => {
    if (isBank) return 'from-blue-500 to-indigo-500';
    return 'from-purple-500 to-pink-500';
  };

  return (
    <div className={`group relative p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 hover:shadow-xl ${
      isDark 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      {/* Background gradient accent */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass()} opacity-5 rounded-2xl`}></div>
      
      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getGradientClass()} flex items-center justify-center text-white`}>
              {getWalletIcon()}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {wallet.name}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {wallet.platform || 'Unknown Platform'}
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <RoundedButton
              onClick={onEdit}
              variant="primary"
              size="sm"
              isDarkMode={isDark}
              className="!px-2 !py-2"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            >
            </RoundedButton>
            <RoundedButton
              onClick={onDelete}
              variant="danger"
              size="sm"
              isDarkMode={isDark}
              className="!px-2 !py-2"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
            </RoundedButton>
          </div>
        </div>
        
        {/* Balance */}
        <div className="mt-4">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Balance</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {wallet.currency || 'USD'} {(wallet.balance || 0).toLocaleString()}
          </p>
        </div>
        
        {/* Additional Info */}
        {wallet.address && (
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} truncate`}>
              {wallet.address}
            </p>
          </div>
        )}
        
        {/* Type Badge */}
        <div className="mt-3">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
            isBank 
              ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
              : isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
          }`}>
            {isBank ? 'Bank Account' : 'Demat Account'}
          </span>
        </div>
      </div>
    </div>
  );
};

const WalletsPage = memo(function WalletsPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const dispatch = useDispatch<AppDispatch>();
  const { items: wallets, loading, creating, error, history, historyLoading } = useSelector((s: RootState) => s.wallets);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bank' | 'demat'>('all');

  useEffect(() => {
    if (!canAccessInvestment()) navigate('/zone');
  }, [canAccessInvestment, navigate]);

  useEffect(() => {
    dispatch(fetchWallets());
    dispatch(fetchWalletHistory());
  }, [dispatch]);

  useEffect(() => {
    const onFocus = () => { 
      dispatch(fetchWallets()); 
      dispatch(fetchWalletHistory()); 
    };
    const onVisible = () => { 
      if (document.visibilityState === 'visible') { 
        dispatch(fetchWallets()); 
        dispatch(fetchWalletHistory()); 
      } 
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dispatch]);

  const isDark = settings.theme === 'dark';

  // Helper functions
  const isBank = (wallet: any) => wallet.type === 'bank' || (!wallet.type && /bank/i.test(wallet.platform || ''));
  const isDemat = (wallet: any) => wallet.type === 'demat' || (!wallet.type && !isBank(wallet));

  // Calculate totals
  const totalsByCurrency = wallets.reduce<Record<string, number>>((acc, w) => {
    const cur = (w.currency || 'USD').toUpperCase();
    const val = typeof w.balance === 'number' ? w.balance : 0;
    acc[cur] = (acc[cur] || 0) + val;
    return acc;
  }, {});

  const dematTotalsByCurrency = wallets.reduce<Record<string, number>>((acc, w) => {
    if (!isDemat(w)) return acc;
    const cur = (w.currency || 'USD').toUpperCase();
    const val = typeof w.balance === 'number' ? w.balance : 0;
    acc[cur] = (acc[cur] || 0) + val;
    return acc;
  }, {});

  const bankTotalsByCurrency = wallets.reduce<Record<string, number>>((acc, w) => {
    if (!isBank(w)) return acc;
    const cur = (w.currency || 'USD').toUpperCase();
    const val = typeof w.balance === 'number' ? w.balance : 0;
    acc[cur] = (acc[cur] || 0) + val;
    return acc;
  }, {});

  // INR to USD conversion for display
  const dematInrTotal = dematTotalsByCurrency['INR'] || 0;
  const dematUsdFromInr = dematInrTotal > 0 ? dematInrTotal / 86 : 0;
  const bankInrTotal = bankTotalsByCurrency['INR'] || 0;
  const bankUsdFromInr = bankInrTotal > 0 ? bankInrTotal / 86 : 0;

  // Filter wallets
  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = searchQuery === '' || 
      wallet.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.platform?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'bank' && isBank(wallet)) ||
      (filterType === 'demat' && isDemat(wallet));
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} flex flex-col`}>
      <Header onlineUsers={[]} sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
      
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Enhanced Header */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
          isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Wallet Management
              </h1>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your bank accounts and demat accounts in one place
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <RoundedButton
                onClick={() => setAddOpen(true)}
                variant="primary"
                size="md"
                isDarkMode={isDark}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Add Wallet
              </RoundedButton>
              
              <RoundedButton
                onClick={() => { 
                  dispatch(fetchWallets()); 
                  dispatch(fetchWalletHistory()); 
                }}
                disabled={loading}
                variant="secondary"
                size="md"
                isDarkMode={isDark}
                icon={loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </RoundedButton>
              
              <div className={`px-3 py-1 rounded-lg ${
                isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
              }`}>
                <span className="text-sm font-medium">
                  {wallets.length} Wallets
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 75% - 25% Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content Area - 75% */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Balance Card */}
              <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
                isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Balance</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(totalsByCurrency).map(([cur, amt]) => (
                        <p key={cur} className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {cur} {amt.toLocaleString()}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Demat Balance Card */}
              <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
                isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Demat Accounts</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(dematTotalsByCurrency).map(([cur, amt]) => (
                        <p key={cur} className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {cur} {amt.toLocaleString()}
                        </p>
                      ))}
                      {dematInrTotal > 0 && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          (≈ ${dematUsdFromInr.toFixed(2)})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Balance Card */}
              <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
                isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Bank Accounts</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(bankTotalsByCurrency).map(([cur, amt]) => (
                        <p key={cur} className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {cur} {amt.toLocaleString()}
                        </p>
                      ))}
                      {bankInrTotal > 0 && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          (≈ ${bankUsdFromInr.toFixed(2)})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
              isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Type Filter */}
                <div className="flex gap-2">
                  <RoundedButton
                    onClick={() => setFilterType('all')}
                    variant={filterType === 'all' ? 'primary' : 'secondary'}
                    size="md"
                    isDarkMode={isDark}
                    isActive={filterType === 'all'}
                  >
                    All Wallets
                  </RoundedButton>
                  <RoundedButton
                    onClick={() => setFilterType('bank')}
                    variant={filterType === 'bank' ? 'primary' : 'secondary'}
                    size="md"
                    isDarkMode={isDark}
                    isActive={filterType === 'bank'}
                  >
                    Bank Accounts
                  </RoundedButton>
                  <RoundedButton
                    onClick={() => setFilterType('demat')}
                    variant={filterType === 'demat' ? 'primary' : 'secondary'}
                    size="md"
                    isDarkMode={isDark}
                    isActive={filterType === 'demat'}
                  >
                    Demat Accounts
                  </RoundedButton>
                </div>

                {/* Search */}
                <div className="relative">
                  <svg className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search wallets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border text-sm ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                </div>
              </div>
            </div>

            {/* Wallets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWallets.length === 0 ? (
                <div className={`col-span-2 text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-lg font-medium">No wallets found</p>
                  <p className="text-sm opacity-75">Add your first wallet to get started</p>
                </div>
              ) : (
                filteredWallets.map(wallet => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    isDark={isDark}
                    onEdit={() => setEditId(wallet.id)}
                    onDelete={() => setConfirmDeleteId(wallet.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Sidebar - 25% */}
          <div className={`lg:col-span-1 p-6 rounded-2xl backdrop-blur-lg border ${
            isDark 
              ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
              : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
          }`}>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {(!history || history.length === 0) ? (
                <div className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                history.slice(0, 10).map((item: any, index: number) => {
                  // Helper function to get wallet name from history data first, then wallets list
                  const getWalletName = (walletId: string, itemData?: any) => {
                    const byData = itemData?.name || itemData?.walletName;
                    if (byData && typeof byData === 'string') return byData;
                    const wallet = wallets.find(w => w.id === walletId);
                    return wallet?.name || 'Unknown Wallet';
                  };

                  // Helper function to format date properly
                  const formatDate = (dateValue: any) => {
                    if (!dateValue) return 'Unknown date';
                    
                    try {
                      let date: Date;
                      
                      if (dateValue.seconds && dateValue.nanoseconds !== undefined) {
                        // Firestore Timestamp object
                        date = new Date(dateValue.seconds * 1000 + dateValue.nanoseconds / 1000000);
                      } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
                        // String or number timestamp
                        date = new Date(dateValue);
                      } else if (dateValue instanceof Date) {
                        // Already a Date object
                        date = dateValue;
                      } else if (dateValue._seconds) {
                        // Alternative Firestore Timestamp format
                        date = new Date(dateValue._seconds * 1000);
                      } else {
                        throw new Error('Unknown date format');
                      }

                      if (isNaN(date.getTime())) {
                        return 'Invalid date';
                      }

                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                    } catch (error) {
                      console.warn('Date formatting error:', error, dateValue);
                      return 'Invalid date';
                    }
                  };

      // Get action display text
      const getActionText = (action: string, data?: any) => {
                    switch (action) {
                      case 'create':
                        return 'Created wallet';
                      case 'update':
        return 'Updated wallet';
                      case 'delete':
                        return 'Deleted wallet';
                      default:
                        return action || 'Activity';
                    }
                  };

                  // Get action icon
                  const getActionIcon = (action: string) => {
                    switch (action) {
                      case 'create':
                        return (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        );
                      case 'update':
                        return (
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        );
                      case 'delete':
                        return (
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        );
                      default:
                        return (
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        );
                    }
                  };

                  return (
                    <div key={item.id || index} className={`p-3 rounded-lg border transition-all duration-200 ${
                      isDark 
                        ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50' 
                        : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
                    }`}>
                      <div className="flex items-start space-x-3">
                        {/* Action Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getActionIcon(item.action)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {getActionText(item.action, item.data)}
                              </p>
                              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                                {getWalletName(item.walletId, item.data)}
                              </p>
                              {/* Additional details if available */}
                              {item.action === 'create' && item.data?.next?.name && (
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  "{item.data.next.name}"
                                </p>
                              )}
                              {item.action === 'update' && item.data?.changes && (
                                <div className="mt-1 space-y-0.5">
                                  {Object.entries(item.data.changes).slice(0,3).map(([field, diff]: any) => (
                                    <p key={field} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {field}: <span className="line-through opacity-70">{String(diff.from ?? '')}</span>
                                      <span className="mx-1">→</span>
                                      <span className="font-medium">{String(diff.to ?? '')}</span>
                                    </p>
                                  ))}
                                  {Object.keys(item.data.changes).length > 3 && (
                                    <p className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>and more…</p>
                                  )}
                                </div>
                              )}
                              {item.action === 'delete' && item.data?.prev && (
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Last balance: {String(item.data.prev.currency || 'USD')} {Number(item.data.prev.balance || 0).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} flex-shrink-0 ml-2`}>
                              {formatDate(item.createdAt || item.updatedAt || item.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Add Wallet Modal */}
        <AddWalletModal
          open={addOpen}
          isDarkMode={isDark}
          onCancel={() => setAddOpen(false)}
          onSave={async (data) => {
            try {
              await dispatch(createWallet({
                name: data.name,
                type: data.type,
                platform: data.platform,
                currency: data.currency,
                address: data.address,
                balance: data.amount,
                notes: data.description
              })).unwrap();
              toast.success('Wallet added successfully');
              setAddOpen(false);
            } catch (error) {
              toast.error('Failed to add wallet');
            }
          }}
        />

        {/* Edit Modal */}
        {editId && (
          <EditWalletModal
            open={!!editId}
            isDarkMode={isDark}
            initial={{
              name: wallets.find(w => w.id === editId)?.name ?? '',
              type: wallets.find(w => w.id === editId)?.type,
              balance: wallets.find(w => w.id === editId)?.balance,
              platform: wallets.find(w => w.id === editId)?.platform,
              currency: wallets.find(w => w.id === editId)?.currency,
              address: wallets.find(w => w.id === editId)?.address,
              notes: wallets.find(w => w.id === editId)?.notes,
            }}
            onCancel={() => setEditId(null)}
            onSave={async (patch) => {
              if (editId) {
                try {
                  await dispatch(updateWallet({ 
                    id: editId, 
                    patch: {
                      balance: patch.amount,
                      platform: patch.method,
                      notes: patch.description
                    }
                  })).unwrap();
                  toast.success('Wallet updated successfully');
                  setEditId(null);
                } catch (error) {
                  toast.error('Failed to update wallet');
                }
              }
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={!!confirmDeleteId}
          title="Delete Wallet"
          message="Are you sure you want to delete this wallet? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isDarkMode={isDark}
          onConfirm={async () => {
            if (confirmDeleteId) {
              try {
                await dispatch(deleteWallet({ id: confirmDeleteId })).unwrap();
                toast.success('Wallet deleted successfully');
                setConfirmDeleteId(null);
              } catch (error) {
                toast.error('Failed to delete wallet');
              }
            }
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      </div>
    </div>
  );
});

export default WalletsPage;
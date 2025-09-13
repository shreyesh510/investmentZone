import React, { memo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useSettings } from '../../../contexts/settingsContext';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import Header from '../../../layouts/header';
import Sidebar from '../../../layouts/sidebar';
import FloatingButton, { type MobileTab } from '../../../components/button/floatingButton';
import type { RootState, AppDispatch } from '../../../redux/store';
import { 
  fetchTradePnL, 
  createTradePnL, 
  updateTradePnL, 
  deleteTradePnL,
  fetchTradePnLStatistics 
} from '../../../redux/thunks/tradePnL/tradePnLThunks';
import { clearError } from '../../../redux/slices/tradePnLSlice';
import AddTradePnLModal from './components/addTradePnLModal';
import EditTradePnLModal from './components/editTradePnLModal';
import ImportTradePnLModal from './components/importTradePnLModal';
import ConfirmModal from '../../../components/modal/confirmModal';
import RoundedButton from '../../../components/button/RoundedButton';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

const TradePnL = memo(function TradePnL() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    period: '7', // days for statistics - default 7 days
    dataFilter: '7' // days for data filtering - default 7 days
  });

  // Redux state
  const { items, statistics, loading, creating, updating, deleting, error } = useSelector(
    (state: RootState) => state.tradePnL
  );

  const isDarkMode = settings.theme === 'dark';

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

  // Fetch data on mount and when filters change
  useEffect(() => {
    dispatch(fetchTradePnL(parseInt(filters.dataFilter)));
    dispatch(fetchTradePnLStatistics(parseInt(filters.dataFilter))); // Use same filter for statistics
  }, [dispatch, filters]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleTabChange = (tab: MobileTab) => setActiveTab(tab);

  // Handler functions
  const handleAddNew = () => {
    const today = new Date().toISOString().split('T')[0];
    // Check if today's record already exists
    const todayExists = items.some(item => item.date === today);
    if (todayExists) {
      toast.warning('Today\'s P&L record already exists. You can edit it instead.');
      return;
    }
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
      dataFilter: '7'
    });
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

  const content = (
    <div className={`flex-1 p-6 flex flex-col min-h-0 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
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

      {/* Statistics Cards */}
      {statistics && (
        <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-6 ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {statistics.period} Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8M3 17h6m0 0V9m0 8l8-8" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Profit</p>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  ${statistics.totalProfit?.toFixed(2) || '0.00'}
                </p>
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
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  ${statistics.totalLoss?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Win Rate</p>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {statistics.winRate || '0%'}
                </p>
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
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ${statistics.averageDailyPnL || '0.00'}
                </p>
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

      {/* Filters */}
      <div className={`p-5 rounded-2xl backdrop-blur-lg border mb-6 ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        <div className="flex flex-wrap gap-4 items-center">
          <h3 className={`text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Filter Period:
          </h3>
          
          <div className="flex items-center space-x-2">
            <select
              value={filters.dataFilter}
              onChange={(e) => handleFilterChange('dataFilter', e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              }`}
            >
              <option value="1">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last 1 Year</option>
              <option value="">All Time</option>
            </select>
          </div>

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
            <div className="overflow-auto flex-1">
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
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col fixed inset-0 overflow-hidden`}>
        <div className="flex-1 overflow-hidden">{content}</div>
        <FloatingButton activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    );
  }

  return (
    <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col`}>
      <Header onlineUsers={onlineUsers} sidebarOpen={sidebarOpen} onSidebarToggle={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex min-h-0 overflow-hidden">{content}</div>

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
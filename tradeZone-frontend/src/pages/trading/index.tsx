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

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [userFilter, setUserFilter] = useState<string>('all');

  // P&L Form State
  const [showPnLModal, setShowPnLModal] = useState(false);
  const [editPnLId, setEditPnLId] = useState<string | null>(null);

  // Common fields for all entries
  const [commonFields, setCommonFields] = useState({
    symbol: 'XAUUSD',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Multiple P&L amounts
  const [pnlAmounts, setPnlAmounts] = useState([0]);

  const symbolOptions = ['XAUUSD', 'BTCUSD', 'ETHUSD'];

  // For edit mode, use single entry
  const [pnlFormData, setPnlFormData] = useState({
    symbol: 'XAUUSD',
    pnl: 0,
    date: new Date().toISOString().split('T')[0],
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

  // Load data
  useEffect(() => {
    dispatch(fetchTradingPnL());
    dispatch(fetchTradingWallets());
    dispatch(fetchWalletBalance());
    if (selectedDate) {
      dispatch(fetchDailySummary(selectedDate));
    }
  }, [dispatch, selectedDate]);

  // Filter P&L by user
  const filteredPnL = userFilter === 'all'
    ? pnlList
    : pnlList.filter(p => p.userName === userFilter);

  // Get unique users
  const uniqueUsers = Array.from(new Set(pnlList.map(p => p.userName)));

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
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setCommonFields({
        symbol: 'XAUUSD',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setPnlAmounts([0]);
      dispatch(fetchTradingPnL());
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

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Trading Management</h1>

      {/* Daily Summary Section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Daily Summary</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-gray-400 text-sm">Total P&L</p>
            <p className={`text-2xl font-bold ${filteredSummary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${filteredSummary.totalPnL.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-gray-400 text-sm">Total Profit</p>
            <p className="text-2xl font-bold text-green-400">
              ${filteredSummary.totalProfit.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-gray-400 text-sm">Total Loss</p>
            <p className="text-2xl font-bold text-red-400">
              ${filteredSummary.totalLoss.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-gray-400 text-sm">Trades Count</p>
            <p className="text-2xl font-bold">{filteredSummary.tradesCount}</p>
          </div>
        </div>
      </div>

      {/* Main Content - 70/30 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section - 70% */}
        <div className="lg:col-span-8 space-y-6">
          {/* P&L Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Trading P&L</h2>
              <button
                onClick={() => {
                  setEditPnLId(null);
                  setCommonFields({
                    symbol: 'XAUUSD',
                    date: new Date().toISOString().split('T')[0],
                    notes: '',
                  });
                  setPnlAmounts([0]);
                  setShowPnLModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                + Add P&L
              </button>
            </div>

            {/* User Filter */}
            <div className="mb-4">
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded w-full md:w-auto"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            {/* P&L List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-left">Symbol</th>
                    <th className="p-3 text-right">P&L</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPnL.map((pnl) => (
                    <tr key={pnl.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="p-3">{new Date(pnl.date).toLocaleDateString()}</td>
                      <td className="p-3">{pnl.userName}</td>
                      <td className="p-3">{pnl.symbol}</td>
                      <td className={`p-3 text-right font-bold ${pnl.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${pnl.pnl.toLocaleString()}
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button
                          onClick={() => openEditPnL(pnl)}
                          className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePnL(pnl.id)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPnL.length === 0 && (
                <div className="text-center py-8 text-gray-400">No P&L entries found</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - 30% */}
        <div className="lg:col-span-4 space-y-6">
          {/* Wallet Balance */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Wallet Balance</h2>
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

import React, { useState, useEffect } from 'react';

interface ImportItem {
  date: string;
  symbol: string;
  side: 'buy' | 'sell';
  lots: number;
  entryPrice: number;
  investedAmount?: number;
  platform?: string;
  account: 'main' | 'longterm';
  pnl?: number;
}

interface Props {
  open: boolean;
  isDarkMode: boolean;
  items: ImportItem[];
  account: 'main' | 'longterm';
  onClose: () => void;
  onConfirm: (confirmedItems: ImportItem[]) => void;
  loading?: boolean;
}

const ImportConfirmationModal: React.FC<Props> = ({ 
  open, 
  isDarkMode, 
  items, 
  account,
  onClose, 
  onConfirm,
  loading = false 
}) => {
  const [confirmedItems, setConfirmedItems] = useState<ImportItem[]>([]);

  // Update confirmedItems when items prop changes
  useEffect(() => {
    setConfirmedItems(items);
  }, [items]);

  if (!open) return null;

  const handleDeleteRow = (index: number) => {
    setConfirmedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onConfirm(confirmedItems);
  };

  const totalInvestment = confirmedItems.reduce((sum, item) => sum + (item.investedAmount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-6xl max-h-[90vh] rounded-2xl backdrop-blur-lg border ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20 text-white' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Confirm Import</h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Review and confirm {confirmedItems.length} positions to import to <span className="font-medium">{account}</span> account
              </p>
            </div>
            <button 
              onClick={onClose}
              disabled={loading}
              className={`p-2 rounded-2xl transition-colors disabled:opacity-50 ${
                isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
              <div className="text-sm font-medium opacity-80">Total Positions</div>
              <div className="text-lg font-semibold">{confirmedItems.length}</div>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
              <div className="text-sm font-medium opacity-80">Total Investment</div>
              <div className="text-lg font-semibold">${totalInvestment.toFixed(2)}</div>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
              <div className="text-sm font-medium opacity-80">Unique Symbols</div>
              <div className="text-lg font-semibold">{new Set(confirmedItems.map(item => item.symbol)).size}</div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="px-6 py-4 flex-1 overflow-hidden">
          {confirmedItems.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4m0 0L9 9l4 4 4-4z" />
              </svg>
              <p>No positions to import</p>
            </div>
          ) : (
            <div className="h-96 overflow-auto">
              <table className="w-full">
                <thead className={`sticky top-0 ${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-sm`}>
                  <tr className={`border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Symbol</th>
                    <th className="text-left py-3 px-4 font-medium">Side</th>
                    <th className="text-left py-3 px-4 font-medium">Lots</th>
                    <th className="text-left py-3 px-4 font-medium">Entry Price</th>
                    <th className="text-left py-3 px-4 font-medium">Investment</th>
                    <th className="text-center py-3 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedItems.map((item, index) => (
                    <tr 
                      key={index} 
                      className={`border-b transition-colors ${
                        isDarkMode 
                          ? 'border-gray-700/30 hover:bg-gray-700/20' 
                          : 'border-gray-200/30 hover:bg-gray-100/30'
                      }`}
                    >
                      <td className="py-3 px-4 text-sm">
                        {(() => {
                          if (!item.date) return 'N/A';
                          
                          // Try to parse the date string
                          let dateStr = item.date;
                          
                          // Handle Delta Exchange format: "2025-09-05 20:27:42.507554+05:30 IST Asia/Kolkata"
                          if (dateStr.includes(' IST ')) {
                            dateStr = dateStr.split(' IST ')[0]; // Remove timezone info
                          }
                          
                          // Extract just the date part (YYYY-MM-DD)
                          const datePart = dateStr.split(' ')[0];
                          
                          const parsedDate = new Date(datePart);
                          return !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : datePart;
                        })()}
                      </td>
                      <td className="py-3 px-4 font-medium">{item.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.side === 'buy'
                            ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                            : (isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                        }`}>
                          {item.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{item.lots}</td>
                      <td className="py-3 px-4 text-sm">${item.entryPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm">${(item.investedAmount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteRow(index)}
                          disabled={loading}
                          className={`p-1 rounded-lg transition-colors disabled:opacity-50 ${
                            isDarkMode 
                              ? 'text-red-400 hover:bg-red-900/20' 
                              : 'text-red-600 hover:bg-red-100'
                          }`}
                          title="Delete row"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={loading || confirmedItems.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Importing...</span>
                </div>
              ) : (
                `Import ${confirmedItems.length} Position${confirmedItems.length !== 1 ? 's' : ''}`
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className={`px-6 py-3 font-medium rounded-2xl transition-colors disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                  : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportConfirmationModal;
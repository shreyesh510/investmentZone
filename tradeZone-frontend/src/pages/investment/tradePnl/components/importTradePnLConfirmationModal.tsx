import React, { useState, useEffect } from 'react';

interface ImportItem {
  date: string;
  symbol: string;
  side: 'buy' | 'sell';
  profit: number;
  loss: number;
  netPnL: number;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  notes?: string;
}

interface Props {
  open: boolean;
  isDarkMode: boolean;
  items: ImportItem[];
  onClose: () => void;
  onConfirm: (confirmedItems: ImportItem[]) => void;
  loading?: boolean;
}

const ImportTradePnLConfirmationModal: React.FC<Props> = ({ 
  open, 
  isDarkMode, 
  items, 
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

  const totalProfit = confirmedItems.reduce((sum, item) => sum + item.profit, 0);
  const totalLoss = confirmedItems.reduce((sum, item) => sum + item.loss, 0);
  const totalNetPnL = confirmedItems.reduce((sum, item) => sum + item.netPnL, 0);

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
              <h2 className="text-xl font-bold">Confirm Trade P&L Import</h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Review and confirm {confirmedItems.length} trade P&L records to import
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
          {/* Summary Stats - Horizontal Metrics Bar */}
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <div className={`flex flex-col md:flex-row items-stretch gap-3`}>
              {/* Total Records */}
              <div className={`flex-1 rounded-xl p-4 flex items-center justify-between ${
                isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/60'
              }`}>
                <div>
                  <div className="text-xs font-medium opacity-80 tracking-wide">Total Records</div>
                  <div className="text-2xl font-bold mt-0.5">{confirmedItems.length}</div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h6m8 2V6a2 2 0 00-2-2H7l-4 4v10a2 2 0 002 2h14a2 2 0 002-2z" />
                  </svg>
                </div>
              </div>

              {/* Total Profit */}
              <div className={`flex-1 rounded-xl p-4 flex items-center justify-between ${
                isDarkMode ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/10' : 'bg-gradient-to-br from-emerald-100 to-green-50'
              }`}>
                <div>
                  <div className="text-xs font-medium opacity-80 tracking-wide">Total Profit</div>
                  <div className="text-2xl font-bold mt-0.5 text-emerald-500">${totalProfit.toFixed(2)}</div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8M3 17h6m0 0V9m0 8l8-8" />
                  </svg>
                </div>
              </div>

              {/* Total Loss */}
              <div className={`flex-1 rounded-xl p-4 flex items-center justify-between ${
                isDarkMode ? 'bg-gradient-to-br from-red-500/10 to-rose-500/10' : 'bg-gradient-to-br from-red-100 to-rose-50'
              }`}>
                <div>
                  <div className="text-xs font-medium opacity-80 tracking-wide">Total Loss</div>
                  <div className="text-2xl font-bold mt-0.5 text-red-500">${totalLoss.toFixed(2)}</div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17H3m0 0v-8m0 8l8-8m18 6h-6m0 0V7m0 8l-8-8" />
                  </svg>
                </div>
              </div>

              {/* Net P&L */}
              <div className={`flex-1 rounded-xl p-4 flex items-center justify-between ${
                totalNetPnL >= 0
                  ? (isDarkMode ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10' : 'bg-gradient-to-br from-green-100 to-emerald-50')
                  : (isDarkMode ? 'bg-gradient-to-br from-rose-500/10 to-red-500/10' : 'bg-gradient-to-br from-rose-100 to-red-50')
              }`}>
                <div>
                  <div className="text-xs font-medium opacity-80 tracking-wide">Net P&L</div>
                  <div className={`text-2xl font-bold mt-0.5 ${totalNetPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalNetPnL >= 0 ? '+' : ''}${totalNetPnL.toFixed(2)}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  totalNetPnL >= 0
                    ? (isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700')
                    : (isDarkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700')
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {totalNetPnL >= 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l4 4L19 6" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>

        {/* Data Table */}
        <div className="px-6 py-4 flex-1 overflow-hidden">
          {confirmedItems.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p>No trade P&L records to import</p>
            </div>
          ) : (
            <div className="h-96 overflow-auto">
              <table className="w-full">
                <thead className={`sticky top-0 ${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-sm`}>
                  <tr className={`border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Symbol</th>
                    <th className="text-left py-3 px-4 font-medium">P&L</th>
                    <th className="text-left py-3 px-4 font-medium">Side</th>
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
                          const parsedDate = new Date(item.date);
                          return !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : item.date;
                        })()}
                      </td>
                      <td className="py-3 px-4 font-medium">{item.symbol}</td>
                      <td className={`py-3 px-4 text-sm font-semibold ${
                        item.netPnL >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {item.netPnL >= 0 ? '+' : ''}${item.netPnL.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.side === 'buy'
                            ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                            : (isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                        }`}>
                          {item.side.toUpperCase()}
                        </span>
                      </td>
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
                {/* Totals Footer */}
                <tfoot className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'} font-bold border-t-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <tr>
                    <td className={`py-3 px-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      TOTAL
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {confirmedItems.length} Records
                    </td>
                    <td className={`py-3 px-4 text-sm font-bold ${
                      totalNetPnL >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {totalNetPnL >= 0 ? '+' : ''}${totalNetPnL.toFixed(2)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
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
                `Import ${confirmedItems.length} Record${confirmedItems.length !== 1 ? 's' : ''}`
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

export default ImportTradePnLConfirmationModal;
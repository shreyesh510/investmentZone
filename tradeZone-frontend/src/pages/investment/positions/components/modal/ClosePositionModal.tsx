import React, { useState } from 'react';
import type { Position } from '../../../../types/position';

interface ClosePositionModalProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, pnl?: number) => void;
  isDarkMode: boolean;
}

const ClosePositionModal: React.FC<ClosePositionModalProps> = ({
  position,
  isOpen,
  onClose,
  onConfirm,
  isDarkMode,
}) => {
  const [pnl, setPnl] = useState<string>('');

  if (!isOpen || !position) return null;

  const handleSubmit = () => {
    const pnlValue = pnl ? parseFloat(pnl) : undefined;
    onConfirm(position.id, pnlValue);
  };

  const handleCancel = () => {
    onClose();
    setPnl('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-2xl backdrop-blur-lg border ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20 text-white' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10 text-gray-900'
      }`}>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Close Position</h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Are you sure you want to close this position?
              </p>
            </div>
            <button 
              onClick={handleCancel}
              className={`p-2 rounded-2xl transition-colors ${
                isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Position Details */}
          <div className={`p-4 rounded-xl ${
            isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Symbol:
              </span>
              <span className={`font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {position.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Side:
              </span>
              <span className={`font-bold ${
                position.side === 'buy' ? 'text-green-400' : 'text-red-400'
              }`}>
                {position.side.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Lots:
              </span>
              <span className={`font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {position.lots}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Invested Amount:
              </span>
              <span className={`font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                ${position.investedAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* P&L Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Final P&L (Optional)
            </label>
            <input
              type="number"
              step="any"
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              placeholder="Enter final P&L amount"
              className={`w-full p-3 rounded-xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
            />
            <p className={`mt-1 text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Leave empty to calculate automatically
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium rounded-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close Position</span>
              </div>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={`px-6 py-3 font-medium rounded-2xl transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                  : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
              }`}
            >
              Cancel
            </button>
          </div>

          {/* Info Section */}
          <div className={`text-sm p-4 rounded-2xl ${
            isDarkMode ? 'bg-gray-700/30 text-gray-400' : 'bg-gray-100/50 text-gray-600'
          }`}>
            <strong>Note:</strong> Closing this position will mark it as completed in your portfolio.
            <br />
            <em>P&L will be calculated automatically if not provided.</em>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosePositionModal;
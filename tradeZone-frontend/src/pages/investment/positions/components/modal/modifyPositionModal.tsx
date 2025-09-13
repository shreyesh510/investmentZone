import React, { useState, useEffect } from 'react';
import type { Position, UpdatePositionData } from '../../../../types/position';

interface ModifyPositionModalProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdatePositionData) => void;
  isDarkMode: boolean;
}

const ModifyPositionModal: React.FC<ModifyPositionModalProps> = ({
  position,
  isOpen,
  onClose,
  onSave,
  isDarkMode,
}) => {
  const [formData, setFormData] = useState<UpdatePositionData>({});
  const [account, setAccount] = useState<'main' | 'longterm'>('main');

  // Initialize form data when position changes
  useEffect(() => {
    if (position) {
      setFormData({
        symbol: position.symbol,
        side: position.side,
        lots: position.lots,
        investedAmount: position.investedAmount,
        platform: position.platform,
        pnl: position.pnl ?? 0, // Ensure pnl is always a number, default to 0 if undefined/null
      });
      setAccount(position.account || 'main');
    }
  }, [position]);

  if (!isOpen || !position) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build the payload with all the fields we want to update
    // Ensure pnl is always included with proper value
    const pnlValue = formData.pnl !== undefined ? formData.pnl : (position.pnl ?? 0);
    const finalPayload: UpdatePositionData = {
      symbol: formData.symbol,
      side: formData.side,
      lots: formData.lots,
      investedAmount: formData.investedAmount,
      platform: formData.platform,
      pnl: pnlValue,
      account: account
    };
    console.log('Saving position with payload:', finalPayload);
    onSave(position.id, finalPayload);
    onClose();
  };

  const handleChange = (field: keyof UpdatePositionData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Symbol is now free-text (Investment Name)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Overlay for dimming background */}
      <div className="absolute inset-0 bg-black/60" aria-hidden="true"></div>
      
      {/* Modal panel */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 rounded-2xl backdrop-blur-lg border max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}>
          <h2 className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Modify Position
          </h2>
          <p className={`mt-2 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Update the details for {position.symbol} position
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Platform
              </label>
              <select
                value={formData.platform || position.platform}
                onChange={(e) => handleChange('platform', e.target.value as 'Delta Exchange' | 'Groww')}
                className={`w-full p-3 rounded-2xl border backdrop-blur-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              >
                <option value="Delta Exchange">Delta Exchange</option>
                <option value="Groww">Groww</option>
              </select>
            </div>

            {/* Investment Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Investment Name
              </label>
              <input
                type="text"
                value={formData.symbol || position.symbol}
                onChange={(e) => handleChange('symbol', e.target.value)}
                placeholder="Enter investment name"
                className={`w-full p-3 rounded-2xl border backdrop-blur-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                required
              />
            </div>

            {/* Lots */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Lots
              </label>
              <input
                type="number"
                value={formData.lots || position.lots}
                onChange={(e) => handleChange('lots', parseFloat(e.target.value) || 0)}
                placeholder="Enter lots"
                min="0.01"
                step="0.01"
                className={`w-full p-3 rounded-2xl border backdrop-blur-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                required
              />
            </div>

            {/* Invested Amount */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Invested Amount
              </label>
              <input
                type="number"
                step="any"
                value={formData.investedAmount || position.investedAmount}
                onChange={(e) => handleChange('investedAmount', parseFloat(e.target.value) || 0)}
                placeholder="Invested amount"
                className={`w-full p-3 rounded-2xl border backdrop-blur-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                required
              />
            </div>

            {/* Current P&L */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Current P&L
              </label>
              <input
                type="number"
                step="any"
                value={formData.pnl !== undefined ? formData.pnl : (position.pnl ?? 0)}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  handleChange('pnl', isNaN(value) ? 0 : value);
                }}
                placeholder="Current P&L (+ for profit, - for loss)"
                className={`w-full p-3 rounded-2xl border backdrop-blur-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
            </div>

            {/* Account */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Account
              </label>
              <div className="flex rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAccount('main')}
                  className={`flex-1 py-3 px-4 font-medium transition-all ${
                    account === 'main'
                      ? 'bg-blue-500 text-white'
                      : isDarkMode
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
                  }`}
                >
                  Main
                </button>
                <button
                  type="button"
                  onClick={() => setAccount('longterm')}
                  className={`flex-1 py-3 px-4 font-medium transition-all ${
                    account === 'longterm'
                      ? 'bg-blue-500 text-white'
                      : isDarkMode
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
                  }`}
                >
                  Longterm
                </button>
              </div>
            </div>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="mt-6">
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Side
            </label>
            <div className="flex rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => handleChange('side', 'buy')}
                className={`flex-1 py-3 px-4 font-medium transition-all ${
                  (formData.side || position.side) === 'buy'
                    ? 'bg-green-500 text-white'
                    : isDarkMode
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => handleChange('side', 'sell')}
                className={`flex-1 py-3 px-4 font-medium transition-all ${
                  (formData.side || position.side) === 'sell'
                    ? 'bg-red-500 text-white'
                    : isDarkMode
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
                }`}
              >
                Sell
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={`p-6 border-t ${
          isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
        } flex justify-end space-x-4`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 rounded-2xl font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModifyPositionModal;



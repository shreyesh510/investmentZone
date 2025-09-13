import React, { useState } from 'react';

interface AddTradePnLModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSave: (data: any) => void;
}

const AddTradePnLModal: React.FC<AddTradePnLModalProps> = ({ isOpen, onClose, isDarkMode, onSave }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    side: '',
    netPnL: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const netPnL = parseFloat(formData.netPnL) || 0;
    const profit = netPnL >= 0 ? netPnL : 0;
    const loss = netPnL < 0 ? Math.abs(netPnL) : 0;
    
    onSave({
      date: formData.date,
      symbol: formData.symbol || undefined,
      side: formData.side || undefined,
      profit,
      loss,
      netPnL,
      notes: formData.notes || undefined
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full max-w-md rounded-2xl shadow-xl overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold">Add Trade P&L Record</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-lg border outline-none ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Symbol (Optional)
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => handleChange('symbol', e.target.value)}
              placeholder="e.g., XRPUSD, BTCUSD"
              className={`w-full px-3 py-2 rounded-lg border outline-none ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Side (Optional)
            </label>
            <select
              value={formData.side}
              onChange={(e) => handleChange('side', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border outline-none ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Select side</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Net P&L ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.netPnL}
              onChange={(e) => handleChange('netPnL', e.target.value)}
              required
              placeholder="Enter positive or negative amount (e.g., 250.50 or -125.75)"
              className={`w-full px-3 py-2 rounded-lg border outline-none ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter positive for profit, negative for loss
            </p>
          </div>

          <div>
            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Add any notes about today's trading..."
              className={`w-full px-3 py-2 rounded-lg border outline-none resize-none ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              className={`flex-1 py-2.5 rounded-lg font-medium ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              Save Record
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-lg font-medium ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              } transition-colors`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTradePnLModal;
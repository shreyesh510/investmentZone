import React, { useState } from 'react';

interface AddDepositModalProps {
  open: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; platform: string; description: string }) => void;
  loading?: boolean;
  error?: string;
}

const AddDepositModal: React.FC<AddDepositModalProps> = ({
  open,
  isDarkMode,
  onClose,
  onSubmit,
  loading = false,
  error
}) => {
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [showQuickAmounts, setShowQuickAmounts] = useState(false);

  const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

  const handleQuickAmount = (amount: number) => {
    setDepositAmount(amount.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    onSubmit({
      amount: parseFloat(depositAmount),
      platform,
      description
    });
  };

  const handleClose = () => {
    setDepositAmount('');
    setDescription('');
    setPlatform('');
    setShowQuickAmounts(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-2xl backdrop-blur-lg border ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20 text-white' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Record Deposit</h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Record a deposit you've already made
              </p>
            </div>
            <button 
              onClick={handleClose}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Deposit Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Deposit Amount
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAmounts(!showQuickAmounts)}
                className={`text-xs font-medium transition-colors ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {showQuickAmounts ? 'Hide' : 'Quick amounts'}
              </button>
            </div>
            
            <div className="relative">
              <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-4 rounded-xl border backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-xl font-medium`}
                required
              />
            </div>
            
            {/* Quick Amount Buttons */}
            {showQuickAmounts && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Platform */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
            >
              <option value="">Select Platform</option>
              <option value="Delta Exchange">Delta Exchange</option>
              <option value="Groww">Groww</option>
              <option value="Exness">Exness</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Notes (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this deposit..."
              className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-all duration-300 hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Recording...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Record Deposit</span>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
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
          
          {error && (
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddDepositModal;
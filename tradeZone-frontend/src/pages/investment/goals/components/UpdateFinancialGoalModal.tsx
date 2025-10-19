import React, { useState, useEffect } from 'react';
import type { Goal } from '../../../../services/goalsApi';

interface UpdateFinancialGoalModalProps {
  open: boolean;
  isDarkMode: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (goalId: string, newAmount: number) => void;
  loading?: boolean;
}

const UpdateFinancialGoalModal: React.FC<UpdateFinancialGoalModalProps> = ({
  open,
  isDarkMode,
  goal,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [addAmount, setAddAmount] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setAddAmount('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !addAmount || parseFloat(addAmount) <= 0) return;

    const newTotal = (goal.currentAmount || 0) + parseFloat(addAmount);
    onSubmit(goal.id, newTotal);
  };

  if (!open || !goal) return null;

  const currentAmount = goal.currentAmount || 0;
  const targetAmount = goal.targetAmount || 0;
  const newAmount = addAmount ? currentAmount + parseFloat(addAmount) : currentAmount;
  const newProgress = targetAmount > 0 ? Math.min((newAmount / targetAmount) * 100, 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl backdrop-blur-lg border ${
        isDarkMode
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20 text-white'
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Add Savings</h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {goal.name}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className={`p-2 rounded-xl transition-colors disabled:opacity-50 ${
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Progress */}
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Current
                </p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ₹{currentAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Target
                </p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ₹{targetAmount.toLocaleString()}
                </p>
              </div>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min((currentAmount / targetAmount) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Add Amount */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              How much are you adding?
            </label>
            <input
              type="number"
              step="0.01"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400'
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-xl font-medium`}
              required
              autoFocus
            />
          </div>

          {/* New Progress Preview */}
          {addAmount && parseFloat(addAmount) > 0 && (
            <div className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
            }`}>
              <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                New Total
              </p>
              <div className="flex items-baseline justify-between mb-2">
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                  ₹{newAmount.toLocaleString()}
                </p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                  {newProgress.toFixed(1)}%
                </p>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${newProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-6 py-3 font-medium rounded-xl transition-colors disabled:opacity-50 ${
                isDarkMode
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !addAmount || parseFloat(addAmount) <= 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Add Amount'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateFinancialGoalModal;

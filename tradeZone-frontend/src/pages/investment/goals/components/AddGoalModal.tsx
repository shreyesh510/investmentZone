import React, { useState } from 'react';
import type { GoalType, CreateGoalDto } from '../../../../services/goalsApi';

interface AddGoalModalProps {
  open: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalDto) => void;
  loading?: boolean;
  error?: string;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({
  open,
  isDarkMode,
  onClose,
  onSubmit,
  loading = false,
  error
}) => {
  const [goalType, setGoalType] = useState<GoalType>('financial');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Financial goal fields
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');

  // Challenge goal fields
  const [totalDays, setTotalDays] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (goalType === 'financial' && (!targetAmount || parseFloat(targetAmount) <= 0)) {
      return;
    }

    if (goalType === 'challenge' && (!totalDays || parseInt(totalDays) <= 0)) {
      return;
    }

    const goalData: CreateGoalDto = {
      name: name.trim(),
      type: goalType,
      status: 'active',
      description: description.trim() || undefined,
    };

    if (goalType === 'financial') {
      goalData.targetAmount = parseFloat(targetAmount);
      goalData.currentAmount = currentAmount ? parseFloat(currentAmount) : 0;
      goalData.currency = 'USD';
    } else {
      goalData.totalDays = parseInt(totalDays);
      goalData.completedDays = 0;
      goalData.completedDates = [];
    }

    onSubmit(goalData);
  };

  const handleClose = () => {
    setGoalType('financial');
    setName('');
    setDescription('');
    setTargetAmount('');
    setCurrentAmount('');
    setTotalDays('');
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
        <div className={`px-6 py-4 border-b ${
          isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Create Goal</h2>
            </div>
            <button
              onClick={handleClose}
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

        {/* Tabs */}
        <div className={`px-6 pt-4 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGoalType('financial')}
              className={`px-6 py-2 font-medium rounded-t-xl transition-all ${
                goalType === 'financial'
                  ? isDarkMode
                    ? 'bg-gray-700/50 text-white border-b-2 border-green-500'
                    : 'bg-white text-gray-900 border-b-2 border-green-500'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Finance
            </button>
            <button
              type="button"
              onClick={() => setGoalType('challenge')}
              className={`px-6 py-2 font-medium rounded-t-xl transition-all ${
                goalType === 'challenge'
                  ? isDarkMode
                    ? 'bg-gray-700/50 text-white border-b-2 border-green-500'
                    : 'bg-white text-gray-900 border-b-2 border-green-500'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Challenge Goal
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Goal Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Goal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter goal name"
              className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400'
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
              required
            />
          </div>

          {/* Financial Goal Fields */}
          {goalType === 'financial' && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Goal Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="10000"
                  className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                    isDarkMode
                      ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400'
                      : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Current Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                    isDarkMode
                      ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400'
                      : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                />
              </div>
            </>
          )}

          {/* Challenge Goal Fields */}
          {goalType === 'challenge' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Total Days
              </label>
              <input
                type="number"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                placeholder="30"
                min="1"
                className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400'
                    : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                required
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400'
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none`}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
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
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Goal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;

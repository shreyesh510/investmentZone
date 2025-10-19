import React, { useState, useEffect } from 'react';
import type { Goal, UpdateGoalDto } from '../../../../services/goalsApi';

interface EditGoalModalProps {
  open: boolean;
  isDarkMode: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateGoalDto) => void;
  loading?: boolean;
  error?: string;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({
  open,
  isDarkMode,
  goal,
  onClose,
  onSubmit,
  loading = false,
  error
}) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'completed' | 'archived'>('active');

  // Financial goal fields
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');

  // Challenge goal fields
  const [totalDays, setTotalDays] = useState<string>('');

  // Common fields
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Populate form when goal changes
  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setDescription(goal.description || '');
      setStatus(goal.status);

      if (goal.type === 'financial') {
        setTargetAmount(goal.targetAmount?.toString() || '');
        setCurrentAmount(goal.currentAmount?.toString() || '');
        setCurrency(goal.currency || 'USD');
      } else {
        setTotalDays(goal.totalDays?.toString() || '');
      }

      setStartDate(goal.startDate || '');
      setEndDate(goal.endDate || '');
    }
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !name.trim()) return;

    if (goal.type === 'financial' && (!targetAmount || parseFloat(targetAmount) <= 0)) {
      return;
    }

    if (goal.type === 'challenge' && (!totalDays || parseInt(totalDays) <= 0)) {
      return;
    }

    const updateData: UpdateGoalDto = {
      name: name.trim(),
      status,
      description: description.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    if (goal.type === 'financial') {
      updateData.targetAmount = parseFloat(targetAmount);
      updateData.currentAmount = currentAmount ? parseFloat(currentAmount) : 0;
      updateData.currency = currency;
    } else {
      updateData.totalDays = parseInt(totalDays);
    }

    onSubmit(goal.id, updateData);
  };

  const handleClose = () => {
    onClose();
  };

  if (!open || !goal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-2xl backdrop-blur-lg border max-h-[90vh] overflow-y-auto ${
        isDarkMode
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20 text-white'
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b sticky top-0 backdrop-blur-lg ${
          isDarkMode ? 'border-gray-700/50 bg-gray-800/50' : 'border-gray-200/50 bg-white/50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Edit Goal</h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Update your {goal.type === 'financial' ? 'financial target' : 'challenge'}
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
          {/* Goal Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Goal Name <span className="text-red-500">*</span>
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

          {/* Status */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'completed' | 'archived')}
              className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-gray-700/50 border-gray-600/50 text-white'
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Financial Goal Fields */}
          {goal.type === 'financial' && (
            <div className="space-y-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                Financial Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Target Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="10000.00"
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border backdrop-blur-sm ${
                        isDarkMode
                          ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400'
                          : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Current Amount
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border backdrop-blur-sm ${
                        isDarkMode
                          ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400'
                          : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                    isDarkMode
                      ? 'bg-gray-700/50 border-gray-600/50 text-white'
                      : 'bg-white/70 border-gray-300/50 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
          )}

          {/* Challenge Goal Fields */}
          {goal.type === 'challenge' && (
            <div className="space-y-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                Challenge Details
              </h3>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Total Days <span className="text-red-500">*</span>
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
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Completed days: {goal.completedDays || 0}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about your goal..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400'
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none`}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Start Date (optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600/50 text-white'
                    : 'bg-white/70 border-gray-300/50 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                End Date (optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600/50 text-white'
                    : 'bg-white/70 border-gray-300/50 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-all duration-300 hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Update Goal</span>
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
        </form>
      </div>
    </div>
  );
};

export default EditGoalModal;

import React from 'react';
import type { Goal } from '../../../../services/goalsApi';

interface MarkDayCompleteModalProps {
  open: boolean;
  isDarkMode: boolean;
  goal: Goal | null;
  onClose: () => void;
  onConfirm: (goalId: string) => void;
  loading?: boolean;
}

const MarkDayCompleteModal: React.FC<MarkDayCompleteModalProps> = ({
  open,
  isDarkMode,
  goal,
  onClose,
  onConfirm,
  loading = false
}) => {
  if (!open || !goal) return null;

  const completedDays = goal.completedDays || 0;
  const totalDays = goal.totalDays || 0;
  const newCompletedDays = completedDays + 1;
  const newProgress = totalDays > 0 ? Math.min((newCompletedDays / totalDays) * 100, 100) : 0;
  const willComplete = newCompletedDays >= totalDays;

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
              <h2 className="text-xl font-bold">Mark Day Complete</h2>
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Progress */}
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Current Progress
            </p>
            <div className="flex items-baseline justify-between mb-2">
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {completedDays} / {totalDays} days
              </p>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {totalDays > 0 ? ((completedDays / totalDays) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${totalDays > 0 ? (completedDays / totalDays) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Message */}
          <div className="text-center py-4">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
            }`}>
              <svg className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Mark today as complete?
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This will add today to your streak
            </p>
          </div>

          {/* New Progress Preview */}
          <div className={`p-4 rounded-xl border ${
            willComplete
              ? isDarkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
              : isDarkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-xs font-medium mb-2 ${
              willComplete
                ? isDarkMode ? 'text-green-400' : 'text-green-700'
                : isDarkMode ? 'text-blue-400' : 'text-blue-700'
            }`}>
              {willComplete ? '🎉 Challenge Will Be Completed!' : 'After Marking Complete'}
            </p>
            <div className="flex items-baseline justify-between mb-2">
              <p className={`text-2xl font-bold ${
                willComplete
                  ? isDarkMode ? 'text-green-400' : 'text-green-700'
                  : isDarkMode ? 'text-blue-400' : 'text-blue-700'
              }`}>
                {newCompletedDays} / {totalDays} days
              </p>
              <p className={`text-lg font-bold ${
                willComplete
                  ? isDarkMode ? 'text-green-400' : 'text-green-700'
                  : isDarkMode ? 'text-blue-400' : 'text-blue-700'
              }`}>
                {newProgress.toFixed(0)}%
              </p>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div
                className={`h-full transition-all duration-500 ${
                  willComplete
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                style={{ width: `${newProgress}%` }}
              />
            </div>
          </div>

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
              type="button"
              onClick={() => onConfirm(goal.id)}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Marking...</span>
                </div>
              ) : (
                'Mark Complete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkDayCompleteModal;

import React from 'react';
import type { Goal } from '../../../../services/goalsApi';

interface GoalCardProps {
  goal: Goal;
  isDarkMode: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onClick: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  isDarkMode,
  onEdit,
  onDelete,
  onClick
}) => {
  // Calculate progress percentage
  const getProgress = () => {
    if (goal.type === 'financial' && goal.targetAmount) {
      const current = goal.currentAmount || 0;
      const target = goal.targetAmount;
      return Math.min((current / target) * 100, 100);
    }

    if (goal.type === 'challenge' && goal.totalDays) {
      const completed = goal.completedDays || 0;
      const total = goal.totalDays;
      return Math.min((completed / total) * 100, 100);
    }

    return 0;
  };

  const progress = getProgress();
  const isCompleted = goal.status === 'completed';
  const isArchived = goal.status === 'archived';

  // Check if today is already marked complete
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = goal.type === 'challenge' &&
    goal.completedDates &&
    goal.completedDates.includes(today);

  // Determine if card should be clickable
  const isClickable = !isCompleted && !isArchived &&
    (goal.type === 'financial' || (goal.type === 'challenge' && !isCompletedToday));

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(goal);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(goal);
  };

  const handleCardClick = () => {
    if (isClickable) {
      onClick(goal);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:shadow-xl ${
        isClickable ? 'cursor-pointer' : 'cursor-default'
      } ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50' : 'bg-white/60 border-white/20 hover:bg-white/80'
      } ${isArchived ? 'opacity-60' : ''}`}
    >
      {/* Header with Actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-4">
          <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {goal.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full ${
              goal.type === 'financial'
                ? isDarkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                : isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
            }`}>
              {goal.type === 'financial' ? 'Financial' : 'Challenge'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isCompleted
                ? isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                : isArchived
                ? isDarkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-700'
                : isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
            }`}>
              {isCompleted ? 'Completed' : isArchived ? 'Archived' : 'Active'}
            </span>
            {isCompletedToday && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
              }`}>
                ✓ Done Today
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEditClick}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700/50 text-gray-400' : 'hover:bg-gray-200/50 text-gray-600'
            }`}
            title="Edit goal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDeleteClick}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-100/50 text-red-600'
            }`}
            title="Delete goal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {goal.description}
        </p>
      )}

      {/* Progress Circle and Stats */}
      <div className="space-y-4">
        {/* Circular Progress */}
        <div className="flex items-center justify-center py-6">
          <div className="relative w-32 h-32">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 1)'}
                strokeWidth="12"
                fill="none"
              />
              {/* Progress Circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={goal.type === 'financial' ? 'url(#financialGradient)' : 'url(#challengeGradient)'}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="financialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="challengeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {progress.toFixed(0)}%
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Complete
              </span>
            </div>
          </div>
        </div>

        {/* Financial Goal Details */}
        {goal.type === 'financial' && (
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Current
                </p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(goal.currentAmount || 0)}
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Target
                </p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(goal.targetAmount || 0)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-600/30">
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                Remaining
              </p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                {formatCurrency(Math.max(0, (goal.targetAmount || 0) - (goal.currentAmount || 0)))}
              </p>
            </div>
          </div>
        )}

        {/* Challenge Goal Details */}
        {goal.type === 'challenge' && (
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
              Days Completed
            </p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {goal.completedDays || 0} / {goal.totalDays || 0}
            </p>
          </div>
        )}

        {/* Click to Update Hint */}
        <div className={`text-center text-xs ${
          !isClickable
            ? isDarkMode ? 'text-gray-600' : 'text-gray-400'
            : isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {isCompleted ? 'Goal completed' :
           isArchived ? 'Goal archived' :
           isCompletedToday ? 'Come back tomorrow to continue' :
           goal.type === 'financial' ? 'Click to add savings' : 'Click to mark day complete'}
        </div>
      </div>
    </div>
  );
};

export default GoalCard;

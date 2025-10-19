import { memo, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSettings } from '../../../contexts/settingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { goalsApi, type Goal, type CreateGoalDto, type UpdateGoalDto } from '../../../services/goalsApi';
import { AddGoalModal, EditGoalModal, GoalCard, UpdateFinancialGoalModal, MarkDayCompleteModal } from './components';
import ConfirmModal from '../../../components/modal/confirmModal';

type FilterTab = 'all' | 'financial' | 'challenge';

const Goals = memo(function Goals() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const isDarkMode = settings?.theme === 'dark';
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<Goal | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [updateFinancialGoal, setUpdateFinancialGoal] = useState<Goal | null>(null);
  const [markDayGoal, setMarkDayGoal] = useState<Goal | null>(null);

  // Redirect if no permission
  useEffect(() => {
    if (!canAccessInvestment()) {
      navigate('/zone');
    }
  }, [canAccessInvestment, navigate]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load goals on mount
  useEffect(() => {
    fetchGoals();
  }, []);

  // Fetch goals from API
  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await goalsApi.list();
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  // Create goal
  const handleCreateGoal = async (data: CreateGoalDto) => {
    setActionLoading(true);
    try {
      const newGoal = await goalsApi.create(data);
      setGoals(prev => [newGoal, ...prev]);
      setShowAddModal(false);
      toast.success('Goal created successfully!');
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast.error(error?.response?.data?.message || 'Failed to create goal');
    } finally {
      setActionLoading(false);
    }
  };

  // Update goal
  const handleUpdateGoal = async (id: string, data: UpdateGoalDto) => {
    setActionLoading(true);
    try {
      await goalsApi.update(id, data);
      const updatedGoal = await goalsApi.getById(id);
      setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
      setEditingGoal(null);
      toast.success('Goal updated successfully!');
    } catch (error: any) {
      console.error('Error updating goal:', error);
      toast.error(error?.response?.data?.message || 'Failed to update goal');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete goal
  const handleDeleteGoal = async () => {
    if (!confirmDeleteGoal) return;

    setActionLoading(true);
    try {
      await goalsApi.remove(confirmDeleteGoal.id);
      setGoals(prev => prev.filter(g => g.id !== confirmDeleteGoal.id));
      setConfirmDeleteGoal(null);
      toast.success('Goal deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete goal');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle card click - open appropriate modal
  const handleCardClick = (goal: Goal) => {
    if (goal.status === 'archived' || goal.status === 'completed') return;

    if (goal.type === 'financial') {
      setUpdateFinancialGoal(goal);
    } else {
      setMarkDayGoal(goal);
    }
  };

  // Update financial goal amount
  const handleUpdateFinancialAmount = async (goalId: string, newAmount: number) => {
    setActionLoading(true);
    try {
      await goalsApi.update(goalId, { currentAmount: newAmount });
      const updatedGoal = await goalsApi.getById(goalId);
      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
      setUpdateFinancialGoal(null);
      toast.success('Savings updated successfully!');
    } catch (error: any) {
      console.error('Error updating goal:', error);
      toast.error(error?.response?.data?.message || 'Failed to update savings');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark day complete for challenge goals
  const handleMarkDayComplete = async (goalId: string) => {
    setActionLoading(true);
    try {
      await goalsApi.markDayComplete(goalId);
      const updatedGoal = await goalsApi.getById(goalId);
      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
      setMarkDayGoal(null);
      toast.success('Day marked as complete!');
    } catch (error: any) {
      console.error('Error marking day complete:', error);
      toast.error(error?.response?.data?.message || 'Failed to mark day complete');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter goals based on active tab
  const filteredGoals = goals.filter(goal => {
    if (activeFilter === 'all') return true;
    return goal.type === activeFilter;
  });

  // Calculate statistics
  const totalGoals = goals.length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const financialGoals = goals.filter(g => g.type === 'financial').length;
  const challengeGoals = goals.filter(g => g.type === 'challenge').length;

  return (
    <div className={`p-4 sm:p-6 lg:p-8 min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Header Section */}
      <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl backdrop-blur-lg border ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Goals
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Track your financial goals and daily challenges
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Goal</span>
              </div>
            </button>

            <button
              onClick={fetchGoals}
              disabled={loading}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                loading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </div>
              )}
            </button>

            <div className={`px-3 py-1 rounded-lg ${
              isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
            }`}>
              <span className="text-sm font-medium">
                {filteredGoals.length} Goals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Goals</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {totalGoals}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeGoals}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {completedGoals}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Financial</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {financialGoals}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={`mb-6 p-4 rounded-2xl backdrop-blur-lg border ${
        isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
      }`}>
        <div className="flex flex-wrap gap-3">
          {(['all', 'financial', 'challenge'] as FilterTab[]).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'All Goals' : filter === 'financial' ? 'Financial Goals' : 'Challenge Goals'}
            </button>
          ))}
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className={`p-12 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        } flex items-center justify-center`}>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading goals...
            </p>
          </div>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className={`p-12 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        } flex items-center justify-center`}>
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <svg className={`w-12 h-12 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No goals yet
            </h3>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {activeFilter === 'all'
                ? 'Create your first goal to start tracking your progress'
                : `No ${activeFilter} goals found. Try switching filters or create a new goal.`
              }
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Your First Goal</span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              isDarkMode={isDarkMode}
              onEdit={(g) => setEditingGoal(g)}
              onDelete={(g) => setConfirmDeleteGoal(g)}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      <AddGoalModal
        open={showAddModal}
        isDarkMode={isDarkMode}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateGoal}
        loading={actionLoading}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        open={!!editingGoal}
        isDarkMode={isDarkMode}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
        onSubmit={handleUpdateGoal}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!confirmDeleteGoal}
        isDarkMode={isDarkMode}
        title="Delete Goal"
        message={`Are you sure you want to delete "${confirmDeleteGoal?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteGoal}
        onCancel={() => setConfirmDeleteGoal(null)}
        loading={actionLoading}
      />

      {/* Update Financial Goal Modal */}
      <UpdateFinancialGoalModal
        open={!!updateFinancialGoal}
        isDarkMode={isDarkMode}
        goal={updateFinancialGoal}
        onClose={() => setUpdateFinancialGoal(null)}
        onSubmit={handleUpdateFinancialAmount}
        loading={actionLoading}
      />

      {/* Mark Day Complete Modal */}
      <MarkDayCompleteModal
        open={!!markDayGoal}
        isDarkMode={isDarkMode}
        goal={markDayGoal}
        onClose={() => setMarkDayGoal(null)}
        onConfirm={handleMarkDayComplete}
        loading={actionLoading}
      />
    </div>
  );
});

export default Goals;

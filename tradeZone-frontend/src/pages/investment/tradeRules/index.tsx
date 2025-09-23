import React, { memo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useSettings } from '../../../contexts/settingsContext';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import type { RootState, AppDispatch } from '../../../redux/store';
import type { CreateTradeRuleDto, UpdateTradeRuleDto } from '../../../services/tradeRulesApi';
import {
  fetchTradeRules,
  createTradeRule,
  updateTradeRule,
  deleteTradeRule,
  recordViolation,
  fetchViolationAnalysis
} from '../../../redux/thunks/tradeRules/tradeRulesThunks';
import {
  fetchPnlLimits,
  updatePnlLimits
} from '../../../redux/thunks/pnlLimits/pnlLimitsThunks';
import { tradeRulesApi } from '../../../services/tradeRulesApi';
import { clearError, toggleRuleActive, resetViolations } from '../../../redux/slices/tradeRulesSlice';
import RoundedButton from '../../../components/button/RoundedButton';
import ConfirmModal from '../../../components/modal/confirmModal';

const TradeRules = memo(function TradeRules() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const isDarkMode = settings.theme === 'dark';

  // Redux state
  const {
    items: rules,
    violationAnalysis,
    loading,
    creating,
    updating,
    deleting,
    recordingViolation,
    error
  } = useSelector((state: RootState) => state.tradeRules);

  // Local state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'violations' | 'recent' | 'importance'>('violations');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [lossAmount, setLossAmount] = useState<number>(5);
  const [profitAmount, setProfitAmount] = useState<number>(15);
  const [showLossEditModal, setShowLossEditModal] = useState(false);
  const [showProfitEditModal, setShowProfitEditModal] = useState(false);
  const [tempLossAmount, setTempLossAmount] = useState<string>('5');
  const [tempProfitAmount, setTempProfitAmount] = useState<string>('15');

  // New rule form state
  const [newRule, setNewRule] = useState<CreateTradeRuleDto>({
    title: '',
    description: '',
    category: 'rule',
    importance: 'medium'
  });

  // Check permissions
  useEffect(() => {
    if (!canAccessInvestment()) {
      navigate('/zone');
    }
  }, [canAccessInvestment, navigate]);

  // Fetch recent activity
  const fetchRecentActivity = async () => {
    try {
      const activity = await tradeRulesApi.getHistory();
      setRecentActivity(activity);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  // Fetch limits from database
  const fetchLimits = async () => {
    try {
      const limits = await tradeRulesApi.getLimits();
      setLossAmount(limits.lossAmount);
      setProfitAmount(limits.profitAmount);
    } catch (error) {
      console.error('Failed to fetch limits:', error);
    }
  };

  // Save loss amount to database
  const handleSaveLossAmount = async (amount: number) => {
    try {
      await tradeRulesApi.updateLimits({ lossAmount: amount });
      setLossAmount(amount);
      setShowLossEditModal(false);
      toast.success('Loss amount updated successfully');
    } catch (error) {
      console.error('Failed to update loss amount:', error);
      toast.error('Failed to update loss amount');
    }
  };

  // Save profit amount to database
  const handleSaveProfitAmount = async (amount: number) => {
    try {
      await tradeRulesApi.updateLimits({ profitAmount: amount });
      setProfitAmount(amount);
      setShowProfitEditModal(false);
      toast.success('Profit amount updated successfully');
    } catch (error) {
      console.error('Failed to update profit amount:', error);
      toast.error('Failed to update profit amount');
    }
  };

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchTradeRules());
    dispatch(fetchViolationAnalysis());
    fetchRecentActivity();
    fetchLimits();
  }, [dispatch]);

  // Handlers
  const handleAddRule = async () => {
    if (!newRule.title || !newRule.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await dispatch(createTradeRule(newRule)).unwrap();
      setNewRule({ title: '', description: '', category: 'rule', importance: 'medium' });
      setShowAddModal(false);
      await fetchRecentActivity(); // Refresh activity
      toast.success('Rule added successfully');
    } catch (error) {
      toast.error('Failed to add rule');
    }
  };

  const handleViolation = async (ruleId: string) => {
    try {
      await dispatch(recordViolation({ id: ruleId })).unwrap();
      // Refresh violation analysis after recording a violation
      dispatch(fetchViolationAnalysis());
      await fetchRecentActivity(); // Refresh activity
      toast.warning('Violation recorded');
    } catch (error) {
      toast.error('Failed to record violation');
    }
  };


  const handleDeleteRule = async (ruleId: string) => {
    try {
      await dispatch(deleteTradeRule({ id: ruleId })).unwrap();
      setDeleteConfirmId(null);
      await fetchRecentActivity(); // Refresh activity
      toast.success('Rule deleted');
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const handleEditRule = async () => {
    if (!editingRule) return;

    try {
      await dispatch(updateTradeRule({
        id: editingRule.id,
        patch: {
          title: editingRule.title,
          description: editingRule.description,
          category: editingRule.category,
          importance: editingRule.importance
        }
      })).unwrap();
      setShowEditModal(false);
      setEditingRule(null);
      await fetchRecentActivity(); // Refresh activity
      toast.success('Rule updated');
    } catch (error) {
      toast.error('Failed to update rule');
    }
  };

  // Filter and sort rules with safety checks
  const filteredAndSortedRules = Array.isArray(rules) ? rules
    .filter(rule => rule)
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (sortBy === 'violations') return (b.violations || 0) - (a.violations || 0);
      if (sortBy === 'recent') {
        if (!a.lastViolation) return 1;
        if (!b.lastViolation) return -1;
        return new Date(b.lastViolation).getTime() - new Date(a.lastViolation).getTime();
      }
      if (sortBy === 'importance') {
        const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (importanceOrder[b.importance] || 0) - (importanceOrder[a.importance] || 0);
      }
      return 0;
    }) : [];


  return (
    <div className={`flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Main Content - 75% on desktop, full width on mobile */}
      <div className="flex-1 min-w-0">
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <p>Error: {error}</p>
            <button
              onClick={() => dispatch(clearError())}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Trade Rules & Mistake Tracker
          </h1>
          <RoundedButton
            onClick={() => setShowAddModal(true)}
            variant="primary"
            isDarkMode={isDarkMode}
            disabled={creating}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            {creating ? 'Adding...' : 'Add New Rule'}
          </RoundedButton>
        </div>
      </div>


      {/* Simple Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Rules</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{Array.isArray(rules) ? rules.length : 0}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Times I Broke Rules</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                {Array.isArray(rules) ? rules.reduce((sum, rule) => sum + (rule?.violations || 0), 0) : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Loss Rules Violations */}
        <div className={`relative p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <button
            className={`absolute top-2 right-2 p-1 rounded ${
              isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'
            }`}
            onClick={() => setShowLossEditModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Loss Rules Broken ({Array.isArray(rules) ? rules.filter(rule => rule?.category === 'loss' && rule?.violations > 0).length : 0})
              </p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                ${lossAmount}
              </p>
            </div>
          </div>
        </div>

        {/* Profit Rules Violations */}
        <div className={`relative p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <button
            className={`absolute top-2 right-2 p-1 rounded ${
              isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'
            }`}
            onClick={() => setShowProfitEditModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Profit Rules Broken ({Array.isArray(rules) ? rules.filter(rule => rule?.category === 'profit' && rule?.violations > 0).length : 0})
              </p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                ${profitAmount}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Rules Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No trade rules found
          </p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Click "Add New Rule" to create your first rule
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredAndSortedRules.map((rule) => (
            <div
              key={rule.id}
              className={`rounded-lg border transition-all hover:shadow-lg ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="p-5">
                {/* Header with title and violation count */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {rule.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rule.importance === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : rule.importance === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : rule.importance === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {rule.importance}
                    </div>
                    <div className={`text-2xl font-bold ${
                      rule.violations === 0
                        ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                        : rule.violations < 5
                        ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600')
                        : (isDarkMode ? 'text-red-400' : 'text-red-600')
                    }`}>
                      {rule.violations}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {rule.description}
                </p>

                {/* Last violation */}
                {rule.lastViolation && (
                  <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Last broken: {new Date(rule.lastViolation).toLocaleDateString()}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViolation(rule.id)}
                    disabled={!rule.isActive || recordingViolation}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      rule.isActive && !recordingViolation
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {recordingViolation ? 'Recording...' : 'I Broke This Rule'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setShowEditModal(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(rule.id)}
                    disabled={deleting}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Add New Trading Rule
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rule Title
                </label>
                <input
                  type="text"
                  value={newRule.title}
                  onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., Don't overtrade"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows={3}
                  placeholder="Why is this rule important? What mistake does it prevent?"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <select
                  value={newRule.category}
                  onChange={(e) => setNewRule({ ...newRule, category: e.target.value as any })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="loss">Loss Rule</option>
                  <option value="profit">Profit Rule</option>
                  <option value="rule">General Rule</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Importance Level
                </label>
                <select
                  value={newRule.importance}
                  onChange={(e) => setNewRule({ ...newRule, importance: e.target.value as any })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddRule}
                disabled={creating}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {creating ? 'Adding...' : 'Add Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {showEditModal && editingRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit Trading Rule
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rule Title
                </label>
                <input
                  type="text"
                  value={editingRule.title}
                  onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows={3}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <select
                  value={editingRule.category}
                  onChange={(e) => setEditingRule({ ...editingRule, category: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="loss">Loss Rule</option>
                  <option value="profit">Profit Rule</option>
                  <option value="rule">General Rule</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Importance Level
                </label>
                <select
                  value={editingRule.importance}
                  onChange={(e) => setEditingRule({ ...editingRule, importance: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRule(null);
                }}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleEditRule}
                disabled={updating}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <ConfirmModal
          open={!!deleteConfirmId}
          title="Delete Rule"
          message="Are you sure you want to delete this rule? All violation history will be lost."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => handleDeleteRule(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Loss Amount Edit Modal */}
      {showLossEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit Loss Amount
            </h2>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Amount per violation ($)
              </label>
              <input
                type="number"
                value={tempLossAmount}
                onChange={(e) => setTempLossAmount(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter amount"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowLossEditModal(false);
                  setTempLossAmount(lossAmount.toString());
                }}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveLossAmount(parseFloat(tempLossAmount) || 0)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profit Amount Edit Modal */}
      {showProfitEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit Profit Amount
            </h2>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Amount per violation ($)
              </label>
              <input
                type="number"
                value={tempProfitAmount}
                onChange={(e) => setTempProfitAmount(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter amount"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowProfitEditModal(false);
                  setTempProfitAmount(profitAmount.toString());
                }}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setProfitAmount(parseFloat(tempProfitAmount) || 0);
                  setShowProfitEditModal(false);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Recent Activity Sidebar - 25% on desktop, full width on mobile */}
      <div className="w-full lg:w-1/4 lg:min-w-80">
        <div className={`rounded-2xl backdrop-blur-lg border h-fit ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
        }`}>
          <div className="p-4 lg:p-6">
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Activity
            </h3>

            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No recent activity
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        activity.action === 'violation_recorded'
                          ? 'bg-red-500 text-white'
                          : activity.action === 'created'
                          ? 'bg-green-500 text-white'
                          : activity.action === 'updated'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {activity.action === 'violation_recorded' ? '⚠' :
                         activity.action === 'created' ? '+' :
                         activity.action === 'updated' ? '✎' : '×'}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {activity.details}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TradeRules;
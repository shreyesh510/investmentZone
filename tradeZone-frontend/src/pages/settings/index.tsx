import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logoutUser } from '../../redux/slices/authSlice';
import { 
  useSettings, 
  cryptoOptions, 
  timeframeOptions, 
  chartStyleOptions 
} from '../../contexts/settingsContext';
import Header from '../../layouts/header';
import Sidebar from '../../layouts/sidebar';
import FloatingButton, { type MobileTab } from '../../components/button/floatingButton';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth.user);
  const { settings, updateSettings, resetSettings, saveSettings } = useSettings();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('settings');

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      // Open sidebar by default on desktop
      if (!isMobileView && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarOpen]);

  // Load permissions from localStorage
  useEffect(() => {
    const loadPermissions = () => {
      try {
        const savedPermissions = localStorage.getItem('permissions');
        if (savedPermissions) {
          setUserPermissions(JSON.parse(savedPermissions));
        } else {
          // Fallback to default permissions
          setUserPermissions({ AiChat: false, investment: false });
        }
      } catch (error) {
        console.error('Error loading permissions from localStorage:', error);
        setUserPermissions({ AiChat: false, investment: false });
      }
    };

    loadPermissions();
  }, []);

  const handleSave = () => {
    saveSettings();
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    setShowResetConfirm(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
  };

  const goBack = () => {
    navigate('/zone');
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

  // Mobile view - show settings in mobile layout
  if (isMobile) {
    return (
      <div 
        className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col fixed inset-0 overflow-hidden`}
        style={{ 
          height: '100svh',
          minHeight: '100vh',
          maxHeight: '100vh',
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: '0px',
          margin: '0px'
        }}
      >
        {/* Content - full screen settings */}
        <div className="flex-1 overflow-hidden" style={{ height: '100vh' }}>
          {renderSettingsContent()}
        </div>

        {/* Floating Navigation */}
        <FloatingButton activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    );
  }

  // Desktop view - with Header and Sidebar
  return (
    <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col`}>
      {/* Top Header */}
      <Header 
        onlineUsers={onlineUsers} 
        sidebarOpen={sidebarOpen} 
        onSidebarToggle={toggleSidebar} 
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content - Settings */}
      <div className="flex-1 overflow-hidden">
        {renderSettingsContent()}
      </div>
    </div>
  );

  // Settings content component
  function renderSettingsContent() {
  return (
      <div className={`h-full flex flex-col overflow-hidden ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Modern Header with Gradient */}
      <div className={`${settings.theme === 'dark' 
        ? 'bg-gradient-to-r from-gray-800 via-gray-800 to-gray-700 border-gray-700' 
        : 'bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-gray-200'
      } border-b shadow-sm`}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={goBack}
              className={`p-3 rounded-full transition-all duration-200 ${
                settings.theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700 hover:scale-110' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-blue-100 hover:scale-110'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Settings
            </h1>
              <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your account and preferences
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Modern Save Button */}
            <button
              onClick={handleSave}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                settings.theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-blue-500/25'
              } transform hover:scale-105`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Save Changes</span>
            </button>
          
            {/* Animated Success Notification */}
            {showSaveSuccess && (
              <div className={`px-4 py-3 rounded-xl flex items-center space-x-2 animate-pulse ${
                settings.theme === 'dark'
                  ? 'bg-green-600 text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              } shadow-lg`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Saved!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Profile Section */}
          <div className={`col-span-1 lg:col-span-2 xl:col-span-1 ${
            settings.theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-br from-white to-blue-50 border-gray-200'
          } rounded-2xl border shadow-lg p-6`}>
            <div className="text-center">
              {/* Avatar */}
              <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold ${
                settings.theme === 'dark'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
              } shadow-lg`}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              
              {/* User Info */}
              <h3 className={`text-xl font-bold mb-1 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {user?.name || 'User'}
              </h3>
              <p className={`text-sm mb-4 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {user?.email || 'user@example.com'}
              </p>
              
              {/* Status Badge */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                settings.theme === 'dark'
                  ? 'bg-green-900 text-green-300 border border-green-700'
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Active
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className={`col-span-1 lg:col-span-2 ${
            settings.theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-br from-white to-purple-50 border-gray-200'
          } rounded-2xl border shadow-lg p-6`}>
            <div className="flex items-center mb-6">
              <div className={`p-3 rounded-xl mr-4 ${
                settings.theme === 'dark'
                  ? 'bg-purple-900/50 text-purple-400'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Your Permissions
                </h3>
                <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Features available to your account
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* AI Chat Permission */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${
                settings.theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${
                    userPermissions?.AiChat
                      ? (settings.theme === 'dark' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600')
                      : (settings.theme === 'dark' ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600')
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>AI Chat</p>
                    <p className={`text-xs ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Access to AI-powered trading assistant
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  userPermissions?.AiChat
                    ? (settings.theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700')
                    : (settings.theme === 'dark' ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')
                }`}>
                  {userPermissions?.AiChat ? 'Enabled' : 'Disabled'}
                </div>
              </div>

              {/* Investment Permission */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${
                settings.theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${
                    userPermissions?.investment
                      ? (settings.theme === 'dark' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600')
                      : (settings.theme === 'dark' ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600')
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Investment Portal</p>
                    <p className={`text-xs ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Access to investment management features
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  userPermissions?.investment
                    ? (settings.theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700')
                    : (settings.theme === 'dark' ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')
                }`}>
                  {userPermissions?.investment ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Appearance Settings */}
          <div className={`${
            settings.theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-br from-white to-orange-50 border-gray-200'
          } rounded-2xl border shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Appearance
            </h2>
            
            {/* Theme Selection */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Theme
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`p-4 rounded-lg border transition-all ${
                    settings.theme === 'dark'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : settings.theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' 
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-800 rounded border border-gray-600"></div>
                    <span className={settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}>Dark</span>
                  </div>
                </button>
                
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`p-4 rounded-lg border transition-all ${
                    settings.theme === 'light'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : settings.theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' 
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded border border-gray-300"></div>
                    <span className={settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}>Light</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Chart Settings */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
            <h2 className={`text-xl font-semibold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Chart Settings
            </h2>
            
            {/* Default Cryptocurrency */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Default Cryptocurrency
              </label>
              <select
                value={settings.defaultCrypto}
                onChange={(e) => updateSettings({ defaultCrypto: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {cryptoOptions.map(crypto => (
                  <option key={crypto.value} value={crypto.value}>
                    {crypto.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Timeframe */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Default Timeframe
              </label>
              <select
                value={settings.defaultTimeframe}
                onChange={(e) => updateSettings({ defaultTimeframe: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {timeframeOptions.map(timeframe => (
                  <option key={timeframe.value} value={timeframe.value}>
                    {timeframe.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Chart Style */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Chart Style
              </label>
              <select
                value={settings.chartStyle}
                onChange={(e) => updateSettings({ chartStyle: e.target.value as any })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {chartStyleOptions.map(style => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferences */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
            <h2 className={`text-xl font-semibold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Preferences
            </h2>
            
            {/* Notifications Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Enable Notifications
                  </label>
                  <p className={`text-xs ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Receive chat and trading alerts
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ notifications: !settings.notifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Auto Save Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Auto Save Settings
                  </label>
                  <p className={`text-xs ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Automatically save changes
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ autoSave: !settings.autoSave })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.autoSave ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
            <h2 className={`text-xl font-semibold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Actions
            </h2>
            
            <div className="space-y-4">
              {/* Reset Button */}
              <button
                onClick={() => setShowResetConfirm(true)}
                className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  settings.theme === 'dark'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reset to Defaults</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 text-red-400 hover:bg-gray-600 border border-red-400'
                    : 'bg-gray-100 text-red-600 hover:bg-gray-200 border border-red-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Reset Settings
            </h3>
            <p className={`mb-6 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Are you sure you want to reset all settings to their default values? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  settings.theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  }
};

export default Settings;

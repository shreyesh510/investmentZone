import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/settingsContext';
import { usePermissions } from '../hooks/usePermissions';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = memo(function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const [activeTab, setActiveTab] = useState<'settings' | 'investment' | null>(null);

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

  const handleTabClick = (tab: 'settings' | 'investment') => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
    }
  };

  const goToZone = () => {
    navigate('/zone');
    onToggle(); // Close sidebar after navigation
  };

  const goToSettings = () => {
    navigate('/settings');
    onToggle(); // Close sidebar after navigation
  };

  // Investment submenu navigation functions
  const goToInvestmentDashboard = () => {
    navigate('/investment/dashboard');
    onToggle(); // Close sidebar after navigation
  };

  const goToPositions = () => {
    navigate('/investment/positions');
    onToggle(); // Close sidebar after navigation
  };



  const goToWithdraw = () => {
    navigate('/investment/withdraw');
    onToggle(); // Close sidebar after navigation
  };

  const goToDeposit = () => {
    navigate('/investment/deposit');
    onToggle(); // Close sidebar after navigation
  };

  const goToWallets = () => {
    navigate('/investment/wallets');
    onToggle(); // Close sidebar after navigation
  };

  const goToTradePnL = () => {
    navigate('/investment/tradePnl');
    onToggle(); // Close sidebar after navigation
  };

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div 
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${
            isDarkMode ? 'bg-black bg-opacity-50' : 'bg-gray-900 bg-opacity-30'
          }`}
          onClick={onToggle}
        />
      )}

      {/* Drawer Sidebar */}
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 transition-transform duration-300 ease-in-out shadow-xl w-64 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isDarkMode 
          ? 'bg-gray-800 border-r border-gray-700' 
          : 'bg-white border-r border-gray-200'
      }`}>
        
        {/* Drawer Header */}
        <div className={`p-4 border-b ${
          isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Menu</h2>
            <button
              onClick={onToggle}
              className={`p-1 rounded transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Drawer Navigation */}
        <div className={`flex flex-col overflow-y-auto ${
          isDarkMode ? '' : 'bg-white'
        }`}>
          {/* Zone Option */}
          <button
            onClick={goToZone}
            className={`flex items-center justify-between px-4 py-4 text-left transition-all duration-200 w-full ${
              isDarkMode 
                ? 'bg-transparent hover:bg-gray-700' 
                : 'bg-transparent hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Zone</span>
            </div>
            <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Investment Option - Only show if user has permission */}
          {canAccessInvestment() && (
            <>
              <button
                onClick={() => handleTabClick('investment')}
                className={`flex items-center justify-between px-4 py-4 text-left transition-all duration-200 w-full ${
                  isDarkMode 
                    ? 'bg-transparent hover:bg-gray-700' 
                    : 'bg-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Investment</span>
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeTab === 'investment' ? 'rotate-90' : ''
                  } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Investment Submenus */}
              {activeTab === 'investment' && (
                <div className={`${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'} border-t border-b ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  {/* Dashboard Submenu */}
                  <button
                    onClick={goToInvestmentDashboard}
                    className={`flex items-center px-8 py-3 text-left transition-all duration-200 w-full ${
                      isDarkMode 
                        ? 'bg-transparent hover:bg-gray-700' 
                        : 'bg-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Dashboard</span>
                    </div>
                  </button>

                  {/* Positions Submenu */}
                  <button
                    onClick={goToPositions}
                    className={`flex items-center px-8 py-3 text-left transition-all duration-200 w-full ${
                      isDarkMode 
                        ? 'bg-transparent hover:bg-gray-700' 
                        : 'bg-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Positions</span>
                    </div>
                  </button>

                  

                  {/* Withdraw Submenu */}
                  <button
                    onClick={goToWithdraw}
                    className={`flex items-center px-8 py-3 text-left transition-all duration-200 w-full ${
                      isDarkMode 
                        ? 'bg-transparent hover:bg-gray-700' 
                        : 'bg-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Withdraw</span>
                    </div>
                  </button>

                  {/* Deposit Submenu */}
                  <button
                    onClick={goToDeposit}
                    className={`flex items-center px-8 py-3 text-left transition-all duration-200 w-full ${
                      isDarkMode 
                        ? 'bg-transparent hover:bg-gray-700' 
                        : 'bg-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Deposit</span>
                    </div>
                  </button>

                  {/* Wallets Submenu */}
                  <button
                    onClick={goToWallets}
                    className={`flex items-center px-8 py-3 text-left transition-all duration-200 w-full ${
                      isDarkMode 
                        ? 'bg-transparent hover:bg-gray-700' 
                        : 'bg-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m0-4h4m0 0l-2-2m2 2l-2 2" />
                      </svg>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Wallets</span>
                    </div>
                  </button>

                  {/* Trade P&L Submenu */}
                  <button
                    onClick={goToTradePnL}
                    className={`flex items-center px-8 py-3 text-left transition-all duration-200 w-full ${
                      isDarkMode 
                        ? 'bg-transparent hover:bg-gray-700' 
                        : 'bg-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Trade P&L</span>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Settings Option */}
          <button
            onClick={goToSettings}
            className={`flex items-center justify-between px-4 py-4 text-left transition-all duration-200 w-full ${
              isDarkMode 
                ? 'bg-transparent hover:bg-gray-700' 
                : 'bg-transparent hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Settings</span>
            </div>
            <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>


    </>
  );
});

export default Sidebar;

import { useState, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/settingsContext';
import { usePermissions } from '../hooks/usePermissions';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const Sidebar = memo(function Sidebar({ isOpen, onToggle, isMobile = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

  // Helper function to check if a path is active
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const goToZone = () => {
    navigate('/zone');
    if (isMobile) onToggle(); // Close sidebar after navigation only on mobile
  };

  const goToSettings = () => {
    navigate('/settings');
    if (isMobile) onToggle(); // Close sidebar after navigation only on mobile
  };

  // Investment submenu navigation functions
  const goToInvestmentDashboard = () => {
    navigate('/investment/dashboard');
    if (isMobile) onToggle(); // Close sidebar after navigation only on mobile
  };

  const goToPositions = () => {
    navigate('/investment/positions');
    if (isMobile) onToggle(); // Close sidebar after navigation only on mobile
  };



  const goToWithdraw = () => {
    navigate('/investment/withdraw');
    if (isMobile) onToggle(); // Close sidebar after navigation only on mobile
  };

  const goToDeposit = () => {
    navigate('/investment/deposit');
    if (isMobile) onToggle(); // Close sidebar after navigation only on mobile
  };

  const goToWallets = () => {
    navigate('/investment/wallets');
    if (isMobile) onToggle(); // Close sidebar after navigation only on mobile
  };

  const goToTradePnL = () => {
    navigate('/investment/tradePnl');
    if (isMobile) onToggle(); // Close sidebar after navigation only on mobile
  };

  return (
    <>
      {/* Backdrop Overlay - Only on mobile */}
      {isMobile && isOpen && (
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${
            isDarkMode ? 'bg-black bg-opacity-50' : 'bg-gray-900 bg-opacity-30'
          }`}
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile
          ? `fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 transition-transform duration-300 ease-in-out shadow-xl w-64 ${
              isOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : `relative h-full transition-all duration-300 ease-in-out ${
              isOpen ? 'w-64' : 'w-16'
            }`
        } ${
        isDarkMode
          ? 'bg-gray-800 border-r border-gray-700'
          : 'bg-white border-r border-gray-200'
      }`}>
        
        {/* Sidebar Header - Clickable to toggle */}
        <div className={`border-b ${
          isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            onClick={onToggle}
            className={`w-full p-4 flex items-center justify-between transition-colors duration-200 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            title={isOpen ? 'Collapse Menu' : 'Expand Menu'}
          >
            {isOpen ? (
              <>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Menu</h2>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </>
            ) : (
              <svg className={`w-6 h-6 mx-auto ${isDarkMode ? 'text-white' : 'text-gray-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation Content */}
        <div className={`flex flex-col overflow-y-auto ${
          isDarkMode ? '' : 'bg-white'
        }`}>
          {/* Dashboard - Show as #1 if user has permission */}
          {canAccessInvestment() && (
            <button
              onClick={goToInvestmentDashboard}
              className={`flex items-center transition-all duration-200 w-full relative ${
                isOpen ? 'px-4 py-4' : 'justify-center px-2 py-4'
              } ${
                isActivePath('/investment/dashboard')
                  ? isDarkMode
                    ? 'bg-gray-700 border-l-4 border-blue-400'
                    : 'bg-gray-50 border-l-4 border-blue-500'
                  : isDarkMode
                    ? 'bg-transparent hover:bg-gray-700'
                    : 'bg-transparent hover:bg-gray-100'
              }`}
              title={!isOpen ? 'Dashboard' : ''}
            >
              <div className={`flex items-center ${isOpen ? 'space-x-3' : ''}`}>
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {isOpen && <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Dashboard</span>}
              </div>
            </button>
          )}

          {/* Zone Option */}
          <button
            onClick={goToZone}
            className={`flex items-center transition-all duration-200 w-full relative ${
              isOpen ? 'px-4 py-4' : 'justify-center px-2 py-4'
            } ${
              isActivePath('/zone')
                ? isDarkMode
                  ? 'bg-gray-700 border-l-4 border-blue-400'
                  : 'bg-gray-50 border-l-4 border-blue-500'
                : isDarkMode
                  ? 'bg-transparent hover:bg-gray-700'
                  : 'bg-transparent hover:bg-gray-100'
            }`}
            title={!isOpen ? 'Zone' : ''}
          >
            <div className={`flex items-center ${isOpen ? 'space-x-3' : ''}`}>
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isOpen && <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Zone</span>}
            </div>
          </button>

          {/* Other Investment Options - Only show if user has permission */}
          {canAccessInvestment() && (
            <>
              {/* Positions */}
              <button
                onClick={goToPositions}
                className={`flex items-center transition-all duration-200 w-full relative ${
                  isOpen ? 'px-4 py-4' : 'justify-center px-2 py-4'
                } ${
                  isActivePath('/investment/positions')
                    ? isDarkMode
                      ? 'bg-gray-700 border-l-4 border-green-400'
                      : 'bg-gray-50 border-l-4 border-green-500'
                    : isDarkMode
                      ? 'bg-transparent hover:bg-gray-700'
                      : 'bg-transparent hover:bg-gray-100'
                }`}
                title={!isOpen ? 'Positions' : ''}
              >
                <div className={`flex items-center ${isOpen ? 'space-x-3' : ''}`}>
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {isOpen && <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Positions</span>}
                </div>
              </button>

              {/* Withdraw */}
              <button
                onClick={goToWithdraw}
                className={`flex items-center transition-all duration-200 w-full relative ${
                  isOpen ? 'px-4 py-4' : 'justify-center px-2 py-4'
                } ${
                  isActivePath('/investment/withdraw')
                    ? isDarkMode
                      ? 'bg-gray-700 border-l-4 border-red-400'
                      : 'bg-gray-50 border-l-4 border-red-500'
                    : isDarkMode
                      ? 'bg-transparent hover:bg-gray-700'
                      : 'bg-transparent hover:bg-gray-100'
                }`}
                title={!isOpen ? 'Withdraw' : ''}
              >
                <div className={`flex items-center ${isOpen ? 'space-x-3' : ''}`}>
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  {isOpen && <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Withdraw</span>}
                </div>
              </button>

              {/* Deposit */}
              <button
                onClick={goToDeposit}
                className={`flex items-center transition-all duration-200 w-full relative ${
                  isOpen ? 'px-4 py-4' : 'justify-center px-2 py-4'
                } ${
                  isActivePath('/investment/deposit')
                    ? isDarkMode
                      ? 'bg-gray-700 border-l-4 border-emerald-400'
                      : 'bg-gray-50 border-l-4 border-emerald-500'
                    : isDarkMode
                      ? 'bg-transparent hover:bg-gray-700'
                      : 'bg-transparent hover:bg-gray-100'
                }`}
                title={!isOpen ? 'Deposit' : ''}
              >
                <div className={`flex items-center ${isOpen ? 'space-x-3' : ''}`}>
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  {isOpen && <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Deposit</span>}
                </div>
              </button>

              {/* Wallets */}
              <button
                onClick={goToWallets}
                className={`flex items-center transition-all duration-200 w-full relative ${
                  isOpen ? 'px-4 py-4' : 'justify-center px-2 py-4'
                } ${
                  isActivePath('/investment/wallets')
                    ? isDarkMode
                      ? 'bg-gray-700 border-l-4 border-yellow-400'
                      : 'bg-gray-50 border-l-4 border-yellow-500'
                    : isDarkMode
                      ? 'bg-transparent hover:bg-gray-700'
                      : 'bg-transparent hover:bg-gray-100'
                }`}
                title={!isOpen ? 'Wallets' : ''}
              >
                <div className={`flex items-center ${isOpen ? 'space-x-3' : ''}`}>
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m0-4h4m0 0l-2-2m2 2l-2 2" />
                  </svg>
                  {isOpen && <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Wallets</span>}
                </div>
              </button>

              {/* Trade P&L */}
              <button
                onClick={goToTradePnL}
                className={`flex items-center transition-all duration-200 w-full relative ${
                  isOpen ? 'px-4 py-4' : 'justify-center px-2 py-4'
                } ${
                  isActivePath('/investment/tradePnl')
                    ? isDarkMode
                      ? 'bg-gray-700 border-l-4 border-purple-400'
                      : 'bg-gray-50 border-l-4 border-purple-500'
                    : isDarkMode
                      ? 'bg-transparent hover:bg-gray-700'
                      : 'bg-transparent hover:bg-gray-100'
                }`}
                title={!isOpen ? 'Trade P&L' : ''}
              >
                <div className={`flex items-center ${isOpen ? 'space-x-3' : ''}`}>
                  <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {isOpen && <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Trade P&L</span>}
                </div>
              </button>
            </>
          )}

          {/* Settings Option */}
          <button
            onClick={goToSettings}
            className={`flex items-center transition-all duration-200 w-full relative ${
              isOpen ? 'px-4 py-4' : 'justify-center px-2 py-4'
            } ${
              isActivePath('/settings')
                ? isDarkMode
                  ? 'bg-gray-700 border-l-4 border-green-400'
                  : 'bg-gray-50 border-l-4 border-green-500'
                : isDarkMode
                  ? 'bg-transparent hover:bg-gray-700'
                  : 'bg-transparent hover:bg-gray-100'
            }`}
            title={!isOpen ? 'Settings' : ''}>
            <div className={`flex items-center ${isOpen ? 'space-x-3' : ''}`}>
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isOpen && <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Settings</span>}
            </div>
          </button>
        </div>
      </div>


    </>
  );
});

export default Sidebar;

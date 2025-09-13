import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/settingsContext';
import { usePermissions } from '../../hooks/usePermissions';

export type MobileTab = 'chart' | 'chat' | 'settings' | 'iDashboard' | 'iPositions' | 'iWithdraw' | 'iDeposit';

interface FloatingButtonProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const FloatingButton = memo(function FloatingButton({ activeTab, onTabChange }: FloatingButtonProps) {
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const isDarkMode = settings.theme === 'dark';

  const baseTabs = [
    {
      id: 'chart' as MobileTab,
      label: 'Chart',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'chat' as MobileTab,
      label: 'Chat',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 'settings' as MobileTab,
      label: 'Settings',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  const investmentTabs = canAccessInvestment() ? [
    {
      id: 'iDashboard' as MobileTab,
      label: 'i-Dashboard',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      )
    },
    {
      id: 'iPositions' as MobileTab,
      label: 'i-Positions',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: 'iWithdraw' as MobileTab,
      label: 'i-Withdraw',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
      )
    },
    {
      id: 'iDeposit' as MobileTab,
      label: 'i-Deposit',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      )
    }
  ] : [];

  const tabs = [...baseTabs, ...investmentTabs];

  const handleTabClick = (tabId: MobileTab) => {
    // Handle investment navigation
    if (tabId === 'iDashboard') {
      navigate('/investment/dashboard');
      setIsExpanded(false);
      return;
    }
    if (tabId === 'iPositions') {
      navigate('/investment/positions');
      setIsExpanded(false);
      return;
    }
    if (tabId === 'iWithdraw') {
      navigate('/investment/withdraw');
      setIsExpanded(false);
      return;
    }
    if (tabId === 'iDeposit') {
      navigate('/investment/deposit');
      setIsExpanded(false);
      return;
    }
    
    // Handle regular tab navigation
    onTabChange(tabId);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40 bg-black/20" 
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating Navigation */}
      <div className="fixed right-4 bottom-20 z-50">
        {/* Navigation Options - shown when expanded */}
        {isExpanded && (
          <div className="mb-3 space-y-2">
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                className="flex items-center justify-end"
                style={{
                  animation: `slideUp 0.2s ease-out ${index * 0.05}s both`,
                  opacity: 0,
                  transform: 'translateY(20px)',
                  animationFillMode: 'forwards'
                }}
              >
                {/* Label */}
                <div className={`mr-3 px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border border-gray-600' 
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  {tab.label}
                </div>
                
                {/* Option Button */}
                <button
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white scale-110'
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={toggleExpanded}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
            isExpanded
              ? 'bg-red-600 text-white rotate-45'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isExpanded ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>


    </>
  );
});

export default FloatingButton;

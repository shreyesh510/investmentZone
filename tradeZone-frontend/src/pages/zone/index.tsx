import { memo, useState, useEffect } from 'react';
import LiveChart from '../../components/chart/liveChart';
import Header from '../../layouts/header';
import Chat from '../dashboard/components/chat';
import Sidebar from '../../layouts/sidebar';
import FloatingButton, { type MobileTab } from '../../components/button/floatingButton';
import ResizablePane from '../../layouts/resizablePane';
import Settings from '../settings';
import { useSettings } from '../../contexts/settingsContext';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

const Zone = memo(function Zone() {
  const { settings } = useSettings();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
  };

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

      // Mobile view - single section based on active tab
    if (isMobile) {
      return (
        <div 
          className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col fixed inset-0 overflow-hidden`}
          style={{ 
            height: '100svh', // Small viewport height for mobile browsers
            minHeight: '100vh', // Fallback for older browsers
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
          {/* Content - full screen */}
          <div className="flex-1 overflow-hidden" style={{ height: '100vh' }}>
            {activeTab === 'chart' && <LiveChart key="live-chart" />}
            {activeTab === 'chat' && <Chat onlineUsers={onlineUsers} setOnlineUsers={setOnlineUsers} />}
            {activeTab === 'settings' && <Settings />}
          </div>

          {/* Floating Navigation */}
          <FloatingButton activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      );
    }

  // Desktop view - original layout (unchanged)
  return (
    <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col`}>
      {/* Top Header with Logout */}
      <Header 
        onlineUsers={onlineUsers} 
        sidebarOpen={sidebarOpen} 
        onSidebarToggle={toggleSidebar} 
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content - Resizable Chart and Chat */}
      <div className="flex-1" style={{height: "100%"}}>
        <ResizablePane
          leftPane={<LiveChart key="live-chart" />}
          rightPane={<Chat onlineUsers={onlineUsers} setOnlineUsers={setOnlineUsers} />}
          initialLeftWidth={70}
          minLeftWidth={30}
          maxLeftWidth={80}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
});

export default Zone;

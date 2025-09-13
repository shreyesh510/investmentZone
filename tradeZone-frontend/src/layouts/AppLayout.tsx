import { ReactNode, useState, useEffect } from 'react';
import { useSettings } from '../contexts/settingsContext';
import Header from './Header';
import Sidebar from './sidebar';

interface AppLayoutProps {
  children: ReactNode;
  onlineUsers?: Array<{
    userId: string;
    userName: string;
    socketId: string;
  }>;
}

const AppLayout = ({ children, onlineUsers = [] }: AppLayoutProps) => {
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start collapsed
  const [isMobile, setIsMobile] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Always start collapsed
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for custom sidebar toggle events from child components
  useEffect(() => {
    const handleToggleSidebar = () => {
      toggleSidebar();
    };

    window.addEventListener('toggleSidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggleSidebar', handleToggleSidebar);
  }, [toggleSidebar]);

  const isDarkMode = settings.theme === 'dark';

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />

      {/* Main Content Area */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${
        !isMobile && !sidebarOpen ? 'ml-0' : ''
      }`}>
        {/* Header/Navbar */}
        <Header
          onlineUsers={onlineUsers}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={toggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Backdrop Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default AppLayout;
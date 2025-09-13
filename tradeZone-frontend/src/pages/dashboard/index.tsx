import { memo, useState } from 'react';
import LiveChart from '../../components/chart/liveChart';
import Header from '../../layouts/header';
import Chat from './components/chat';
import Sidebar from '../../layouts/sidebar';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

const Dashboard = memo(function Dashboard() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen mobile-full-height max-h-screen bg-gray-900 flex flex-col overflow-hidden fixed inset-0">image.png
      {/* Top Header with Logout */}
      <div className="flex-shrink-0 relative z-10">
        <Header 
          onlineUsers={onlineUsers} 
          sidebarOpen={sidebarOpen} 
          onSidebarToggle={toggleSidebar} 
        />
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content - Chart and Chat */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Chart Section - Top 60% on mobile, 70% width on desktop */}
        <div className="w-full md:w-[70%] h-[60%] md:h-full flex-shrink-0 overflow-hidden relative">
          <LiveChart key="live-chart" />
        </div>

        {/* Chat Section - Bottom 40% on mobile, 30% width on desktop */}
        <div className="w-full md:w-[30%] h-[40%] md:h-full flex-shrink-0 overflow-hidden">
          <Chat onlineUsers={onlineUsers} setOnlineUsers={setOnlineUsers} />
        </div>
      </div>
    </div>
  );
});

export default Dashboard;



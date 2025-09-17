import { memo, useState } from 'react';
import LiveChart from '../../components/chart/liveChart';
import Header from '../../layouts/Header';
import Chat from './components/Chat';
import Sidebar from '../../layouts/sidebar';
import FinancialMetrics from '../../components/dashboard/FinancialMetrics';
import { usePageTitle, PAGE_TITLES } from '../../hooks/usePageTitle';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

const Dashboard = memo(function Dashboard() {
  usePageTitle(PAGE_TITLES.DASHBOARD);

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen mobile-full-height max-h-screen bg-gray-900 flex flex-col overflow-hidden fixed inset-0">
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

      {/* Main Content - Chart, Financial Metrics, and Chat */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Chart Section - Full width on mobile, 50% on desktop */}
        <div className="w-full lg:w-[50%] h-[50%] lg:h-full flex-shrink-0 overflow-hidden relative">
          <LiveChart key="live-chart" />
        </div>

        {/* Right Panel - Financial Metrics and Chat */}
        <div className="w-full lg:w-[50%] h-[50%] lg:h-full flex flex-col overflow-hidden">
          {/* Financial Metrics - Top half of right panel */}
          <div className="h-1/2 overflow-y-auto p-4">
            <FinancialMetrics />
          </div>

          {/* Chat Section - Bottom half of right panel */}
          <div className="h-1/2 overflow-hidden">
            <Chat onlineUsers={onlineUsers} setOnlineUsers={setOnlineUsers} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;



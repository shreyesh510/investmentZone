import { memo, useState, useEffect } from 'react';
import LiveChart from '../../components/chart/liveChart';
import Chat from '../dashboard/components/Chat';
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

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';


  // Desktop view - just the content without header/sidebar
  return (
    <div className={`h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col`}>
      {/* Main Content - Resizable Chart and Chat */}
      <div className="flex-1 h-full">
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

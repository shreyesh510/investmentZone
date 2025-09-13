import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logoutUser } from '../redux/slices/authSlice';
import { useSettings } from '../contexts/settingsContext';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

interface HeaderProps {
  onlineUsers: OnlineUser[];
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const Header = ({ onlineUsers, sidebarOpen, onSidebarToggle }: HeaderProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { settings } = useSettings();

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
    navigate('/');
  }, [dispatch, navigate]);

  const { updateSettings } = useSettings();

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 flex justify-between items-center h-16`}>
      <div className="flex items-center">
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>IZone</h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {onlineUsers.length} online
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd"/>
            </svg>
          )}
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.name || 'User'}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

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

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 flex justify-between items-center`}>
      <div className="flex items-center space-x-4">
        {/* Menu Toggle Button - Hidden on mobile */}
        <button
          onClick={onSidebarToggle}
          className={`p-1 rounded-lg transition-colors duration-200 mr-2 hidden md:block ${
            isDarkMode 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
          title={sidebarOpen ? 'Close Menu' : 'Open Menu'}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {sidebarOpen ? (
              // X icon when sidebar is open
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              // Hamburger menu when sidebar is closed
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Zone</h1>
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
      
      <div className="flex items-center space-x-3">
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {onlineUsers.length} online
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;

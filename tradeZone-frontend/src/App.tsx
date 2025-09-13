import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth } from './redux/slices/authSlice';
import type { AppDispatch, RootState } from './redux/store';
import { SettingsProvider } from './contexts/settingsContext';
import { ToastProvider } from './contexts/toastContext';
import { ReactToastifyProvider } from './contexts/ReactToastifyContext';
import { SocketProvider } from './contexts/SocketContext';
import ToastContainer from './components/toast/toastContainer';
import { createAppRoutes } from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Component to manage body classes based on route
function RouteManager() {
  const location = useLocation();

  useEffect(() => {
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    if (isAuthPage) {
      // Remove app-mode class for auth pages (allow scrolling)
      document.body.classList.remove('app-mode');
    } else {
      // Add app-mode class for app pages (prevent body scrolling, only content scrolls)
      document.body.classList.add('app-mode');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('app-mode');
    };
  }, [location.pathname]);

  return null;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check localStorage for existing credentials
    const testToken = localStorage.getItem('testToken');
    const userData = localStorage.getItem('user');
    
  // removed debug logs

    if (testToken && userData) {
      // User has credentials, initialize auth state
      dispatch(initializeAuth());
  // removed debug log
    } else {
  // removed debug log
    }
    
    setIsInitialized(true);
  }, [dispatch]);

  // Show loading while checking credentials
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <ReactToastifyProvider>
        <ToastProvider>
          <SocketProvider>
          <Router>
            <RouteManager />
            <ErrorBoundary>
              <div className="App h-full w-full overflow-hidden">
                <Routes>
                  {createAppRoutes({ isAuthenticated }).map((route, index) => (
                    <Route key={index} {...route} />
                  ))}
                </Routes>

                {/* Global Toast Container */}
                <ToastContainer />
              </div>
            </ErrorBoundary>
          </Router>
        </SocketProvider>
      </ToastProvider>
    </ReactToastifyProvider>
    </SettingsProvider>
  );
}

export default App;

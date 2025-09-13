import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth } from './redux/slices/authSlice';
import type { AppDispatch, RootState } from './redux/store';
import { SettingsProvider } from './contexts/settingsContext';
import { ToastProvider } from './contexts/toastContext';
import { ReactToastifyProvider } from './contexts/reactToastifyContext';
import { SocketProvider } from './contexts/socketContext';
import ToastContainer from './components/toast/toastContainer';
import { createAppRoutes } from './routes/appRoutes';
import './index.css';

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
            <div className="App h-full w-full overflow-hidden">
              <Routes>
                {createAppRoutes({ isAuthenticated }).map((route, index) => (
                  <Route key={index} {...route} />
                ))}
              </Routes>
              
              {/* Global Toast Container */}
              <ToastContainer />
            </div>
          </Router>
        </SocketProvider>
      </ToastProvider>
    </ReactToastifyProvider>
    </SettingsProvider>
  );
}

export default App;

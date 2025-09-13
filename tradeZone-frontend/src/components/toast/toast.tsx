import { memo, useEffect, useState } from 'react';
import { useSettings } from '../../contexts/settingsContext';

interface ToastProps {
  id: string;
  message: string;
  senderName: string;
  type?: 'message' | 'success' | 'error' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const Toast = memo(function Toast({ 
  id, 
  message, 
  senderName, 
  type = 'message', 
  duration = 4000, 
  onClose 
}: ToastProps) {
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const isDarkMode = settings.theme === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose(id);
      }, 300); // Animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = `transform transition-all duration-300 ease-in-out ${
      isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
    }`;

    switch (type) {
      case 'message':
        return `${baseStyles} ${
          isDarkMode 
            ? 'bg-blue-600 border-blue-500 text-white' 
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`;
      case 'success':
        return `${baseStyles} ${
          isDarkMode 
            ? 'bg-green-600 border-green-500 text-white' 
            : 'bg-green-50 border-green-200 text-green-900'
        }`;
      case 'error':
        return `${baseStyles} ${
          isDarkMode 
            ? 'bg-red-600 border-red-500 text-white' 
            : 'bg-red-50 border-red-200 text-red-900'
        }`;
      case 'info':
      default:
        return `${baseStyles} ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-gray-50 border-gray-200 text-gray-900'
        }`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'message':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`flex items-start p-4 border rounded-lg shadow-lg max-w-sm w-full ${getToastStyles()}`}>
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium truncate">
            {senderName}
          </p>
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => {
                setIsVisible(false);
                onClose(id);
              }, 300);
            }}
            className={`ml-2 flex-shrink-0 ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm break-words line-clamp-2">
          {message}
        </p>
      </div>
    </div>
  );
});

export default Toast;

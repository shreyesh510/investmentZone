import React from 'react';

interface RoundedButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isDarkMode?: boolean;
  isActive?: boolean;
  icon?: React.ReactNode;
}

const RoundedButton: React.FC<RoundedButtonProps> = ({
  onClick,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  isDarkMode = false,
  isActive = false,
  icon
}) => {
  const getVariantClasses = () => {
    if (isActive && variant === 'primary') {
      return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700';
    }

    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'secondary':
        return isDarkMode 
          ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
          : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50';
      case 'danger':
        return isDarkMode 
          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
          : 'bg-red-100 text-red-600 hover:bg-red-200';
      case 'purple':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-xs';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${getSizeClasses()} rounded-lg font-medium transition-colors ${getVariantClasses()} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {icon ? (
        <div className="flex items-center space-x-2">
          {icon}
          <span>{children}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default RoundedButton;
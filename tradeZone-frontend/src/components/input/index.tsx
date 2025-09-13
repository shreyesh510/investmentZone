import React from 'react';

interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  className?: string;
  isDarkMode?: boolean;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  required = false,
  min,
  max,
  step,
  className = '',
  isDarkMode = false,
  disabled = false,
}) => {
  const baseInputClasses = `w-full p-3 rounded-xl border backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
    isDarkMode 
      ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
      : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  return (
    <div>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        required={required}
        disabled={disabled}
        className={baseInputClasses}
      />
    </div>
  );
};

export default Input;


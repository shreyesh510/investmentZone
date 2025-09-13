import React from 'react';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  label?: string;
  required?: boolean;
  className?: string;
  isDarkMode?: boolean;
  disabled?: boolean;
}

const Radio: React.FC<RadioProps> = ({
  value,
  onChange,
  options,
  label,
  required = false,
  className = '',
  isDarkMode = false,
  disabled = false,
}) => {
  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex rounded-xl overflow-hidden">
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`flex-1 py-3 px-4 font-medium transition-all ${
              value === option.value
                ? option.value === 'buy'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                : isDarkMode
                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Radio;


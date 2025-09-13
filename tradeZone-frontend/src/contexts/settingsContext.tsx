import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Settings interface
export interface AppSettings {
  theme: 'light' | 'dark';
  defaultCrypto: string;
  defaultTimeframe: string;
  chartStyle: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  notifications: boolean;
  autoSave: boolean;
}

// Default settings
const defaultSettings: AppSettings = {
  theme: 'dark',
  defaultCrypto: 'DOGEUSD',
  defaultTimeframe: '5',
  chartStyle: '1', // Candlestick
  notifications: true,
  autoSave: true,
};

// Available options
export const cryptoOptions = [
  { value: 'DOGEUSD', label: 'Dogecoin / USD', symbol: 'DOGE' },
  { value: 'BTCUSD', label: 'Bitcoin / USD', symbol: 'BTC' },
  { value: 'ETHUSD', label: 'Ethereum / USD', symbol: 'ETH' },
  { value: 'ADAUSD', label: 'Cardano / USD', symbol: 'ADA' },
  { value: 'SOLUSD', label: 'Solana / USD', symbol: 'SOL' },
  { value: 'MATICUSD', label: 'Polygon / USD', symbol: 'MATIC' },
  { value: 'DOTUSD', label: 'Polkadot / USD', symbol: 'DOT' },
  { value: 'AVAXUSD', label: 'Avalanche / USD', symbol: 'AVAX' },
];

export const timeframeOptions = [
  { value: '1', label: '1 Minute' },
  { value: '5', label: '5 Minutes' },
  { value: '15', label: '15 Minutes' },
  { value: '30', label: '30 Minutes' },
  { value: '60', label: '1 Hour' },
  { value: '240', label: '4 Hours' },
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' },
];

export const chartStyleOptions = [
  { value: '1', label: 'Candlestick' },
  { value: '2', label: 'OHLC Bars' },
  { value: '3', label: 'Line' },
  { value: '4', label: 'Area' },
  { value: '5', label: 'Heiken Ashi' },
  { value: '6', label: 'Hollow Candlestick' },
  { value: '7', label: 'Baseline' },
  { value: '8', label: 'High-Low' },
  { value: '9', label: 'Column' },
];

// Context interface
interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  saveSettings: () => void;
}

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Local storage key
const SETTINGS_STORAGE_KEY = 'tradeZone_settings';

// Settings provider component
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
          const parsedSettings = JSON.parse(saved);
          // Merge with defaults to ensure all keys exist
          setSettings({ ...defaultSettings, ...parsedSettings });
          console.log('✅ Settings loaded from localStorage:', parsedSettings);
        } else {
          console.log('📝 Using default settings');
        }
      } catch (error) {
        console.error('❌ Error loading settings:', error);
        setSettings(defaultSettings);
      }
    };

    loadSettings();
  }, []);

  // Update settings function
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Auto-save if enabled
      if (updated.autoSave) {
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
          console.log('💾 Settings auto-saved:', newSettings);
        } catch (error) {
          console.error('❌ Error auto-saving settings:', error);
        }
      }
      
      return updated;
    });
  };

  // Manual save function
  const saveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      console.log('💾 Settings manually saved');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    }
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
      console.log('🔄 Settings reset to defaults');
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;

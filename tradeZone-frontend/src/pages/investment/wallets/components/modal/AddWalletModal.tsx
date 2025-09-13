import React, { useEffect, useState } from 'react';

interface AddWalletModalProps {
  open: boolean;
  onSave: (payload: { 
    name: string; 
    type: 'demat' | 'bank'; 
    platform?: string;
    currency?: string;
    address?: string;
    amount?: number; 
    description?: string;
  }) => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

const AddWalletModal: React.FC<AddWalletModalProps> = ({ open, onSave, onCancel, isDarkMode = false }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'demat' | 'bank'>('demat');
  const [platform, setPlatform] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [customCurrency, setCustomCurrency] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Common platforms for demat and bank accounts
  const platforms = type === 'demat' 
    ? ['Grow', 'Delta Exchange', 'Exness', 'Other']
    : ['Bank', 'Other'];

  // Common currencies
  const currencies = ['INR', 'USD', 'Other'];

  useEffect(() => {
    if (open) {
      setName('');
      setType('demat');
      setPlatform('');
      setCustomPlatform('');
      setCurrency('INR');
      setCustomCurrency('');
      setAddress('');
      setAmount('');
      setDescription('');
    }
  }, [open]);

  // Reset platform when type changes
  useEffect(() => {
    setPlatform('');
    setCustomPlatform('');
  }, [type]);

  if (!open) return null;

  const bg = isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const border = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  const handleSave = () => {
    if (!name.trim()) return;
    const amt = parseFloat(amount);
    const finalPlatform = platform === 'Other' ? customPlatform.trim() : platform;
    const finalCurrency = currency === 'Other' ? customCurrency.trim() : currency;
    
    onSave({ 
      name: name.trim(), 
      type,
      platform: finalPlatform || undefined,
      currency: finalCurrency || undefined,
      address: address.trim() || undefined,
      amount: isNaN(amt) ? undefined : amt, 
      description: description.trim() || undefined 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-2xl backdrop-blur-lg border ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20 text-white' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10 text-gray-900'
      }`}>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Add Wallet</h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Add a new wallet or bank account
              </p>
            </div>
            <button 
              onClick={onCancel}
              className={`p-2 rounded-2xl transition-colors ${
                isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Account Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'demat' | 'bank')}
              className={`w-full px-4 py-3 rounded-2xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              <option value="demat">Demat Account</option>
              <option value="bank">Bank Account</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Account Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Delta Exchange Main"
              className={`w-full px-4 py-3 rounded-2xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                if (e.target.value !== 'Other') setCustomPlatform('');
              }}
              className={`w-full px-4 py-3 rounded-2xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              <option value="">Select Platform</option>
              {platforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {platform === 'Other' && (
              <input
                type="text"
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                placeholder="Enter platform name"
                className={`w-full px-4 py-3 rounded-2xl border backdrop-blur-sm mt-2 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
            )}
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Initial Balance (optional)
            </label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-3 rounded-2xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                if (e.target.value !== 'Other') setCustomCurrency('');
              }}
              className={`w-full px-4 py-3 rounded-2xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              {currencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {currency === 'Other' && (
              <input
                type="text"
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value)}
                placeholder="Enter currency code"
                className={`w-full px-4 py-3 rounded-2xl border backdrop-blur-sm mt-2 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
            )}
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Account ID (optional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter account ID"
              className={`w-full px-4 py-3 rounded-2xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Note for this wallet"
              rows={3}
              className={`w-full px-4 py-3 rounded-2xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none`}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-2">
            <button 
              onClick={handleSave} 
              disabled={!name.trim()} 
              className={`flex-1 px-6 py-3 font-medium rounded-2xl transition-all duration-300 hover:scale-105 ${
                !name.trim() 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Wallet</span>
              </div>
            </button>
            <button 
              onClick={onCancel} 
              className={`px-6 py-3 font-medium rounded-2xl transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                  : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
              }`}
            >
              Cancel
            </button>
          </div>

          {/* Info Section */}
          <div className={`text-sm p-4 rounded-2xl ${
            isDarkMode ? 'bg-gray-700/30 text-gray-400' : 'bg-gray-100/50 text-gray-600'
          }`}>
            <strong>Tip:</strong> Choose the appropriate account type and platform for better organization.
            <br />
            <em>Initial balance and account ID are optional but help track your portfolio.</em>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWalletModal;
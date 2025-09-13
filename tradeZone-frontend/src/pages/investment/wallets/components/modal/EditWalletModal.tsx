import React, { useEffect, useState } from 'react';

interface EditWalletModalProps {
  open: boolean;
  initial: { 
    name: string; 
    type?: 'demat' | 'bank';
    balance?: number; 
    platform?: string; 
    currency?: string;
    address?: string;
    notes?: string;
  };
  onSave: (patch: { 
    name?: string;
    type?: 'demat' | 'bank';
    balance?: number; 
    platform?: string; 
    currency?: string;
    address?: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

const EditWalletModal: React.FC<EditWalletModalProps> = ({ open, initial, onSave, onCancel, isDarkMode = false }) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<'demat' | 'bank'>('demat');
  const [balance, setBalance] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [customPlatform, setCustomPlatform] = useState<string>('');
  const [currency, setCurrency] = useState<string>('');
  const [customCurrency, setCustomCurrency] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Common platforms for demat and bank accounts
  const platforms = type === 'demat' 
    ? ['Grow', 'Delta Exchange', 'Exness', 'Other']
    : ['Bank', 'Other'];

  // Common currencies
  const currencies = ['INR', 'USD', 'Other'];

  useEffect(() => {
    if (open) {
      setName(initial.name ?? '');
      setType(initial.type ?? 'demat');
      setBalance(String(initial.balance ?? ''));
      
      // Set platform
      const initPlatform = initial.platform ?? '';
      if (initPlatform && !platforms.includes(initPlatform)) {
        setPlatform('Other');
        setCustomPlatform(initPlatform);
      } else {
        setPlatform(initPlatform || '');
        setCustomPlatform('');
      }
      
      // Set currency
      const initCurrency = initial.currency ?? 'INR';
      if (initCurrency && !currencies.includes(initCurrency)) {
        setCurrency('Other');
        setCustomCurrency(initCurrency);
      } else {
        setCurrency(initCurrency);
        setCustomCurrency('');
      }
      
      setAddress(initial.address ?? '');
      setNotes(initial.notes ?? '');
    }
  }, [open, initial]);

  if (!open) return null;

  const bg = isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const border = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  const handleSave = () => {
    const patch: any = {};
    if (name.trim() !== initial.name) patch.name = name.trim();
    if (type !== initial.type) patch.type = type;
    const bal = parseFloat(balance);
    if (!isNaN(bal) && bal !== initial.balance) patch.balance = bal;
    
    // Handle platform
    const finalPlatform = platform === 'Other' ? customPlatform.trim() : platform;
    if (finalPlatform !== (initial.platform || '')) patch.platform = finalPlatform;
    
    // Handle currency
    const finalCurrency = currency === 'Other' ? customCurrency.trim() : currency;
    if (finalCurrency !== (initial.currency || '')) patch.currency = finalCurrency;
    
    if (address.trim() !== (initial.address || '')) patch.address = address.trim();
    if (notes.trim() !== (initial.notes || '')) patch.notes = notes.trim();
    onSave(patch);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div onClick={(e) => e.stopPropagation()} className={`${bg} relative z-10 w-full max-w-md rounded-xl shadow-xl border ${border}`}>
        <div className="p-5 border-b border-gray-700/40">
          <h3 className="text-lg font-semibold">Edit Wallet</h3>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm mb-1">Account Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'demat' | 'bank')}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="demat">Demat Account</option>
              <option value="bank">Bank Account</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Account Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Delta Exchange Main"
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                if (e.target.value !== 'Other') setCustomPlatform('');
              }}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
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
                className={`w-full px-3 py-2 rounded-lg border mt-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Balance</label>
            <input
              type="number"
              step="any"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                if (e.target.value !== 'Other') setCustomCurrency('');
              }}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
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
                className={`w-full px-3 py-2 rounded-lg border mt-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Account ID (optional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter account ID"
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        </div>
        <div className="p-5 flex justify-end gap-3 border-t border-gray-700/40">
          <button onClick={onCancel} className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditWalletModal;
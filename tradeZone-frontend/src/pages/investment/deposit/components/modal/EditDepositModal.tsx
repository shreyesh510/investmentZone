import React, { useEffect, useState } from 'react';

interface EditDepositModalProps {
  open: boolean;
  initial: { amount: number; method?: string; description?: string };
  onSave: (patch: { amount?: number; method?: string; description?: string }) => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

const EditDepositModal: React.FC<EditDepositModalProps> = ({ open, initial, onSave, onCancel, isDarkMode = false }) => {
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    if (open) {
      setAmount(String(initial.amount ?? ''));
      setMethod(initial.method ?? '');
      setDescription(initial.description ?? '');
    }
  }, [open, initial]);

  if (!open) return null;

  const bg = isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const border = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  const handleSave = () => {
    const patch: { amount?: number; method?: string; description?: string } = {};
    const amt = parseFloat(amount);
    if (!isNaN(amt)) patch.amount = amt;
    if (method.trim() !== '') patch.method = method.trim();
    if (description.trim() !== '') patch.description = description.trim();
    onSave(patch);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div onClick={(e) => e.stopPropagation()} className={`${bg} relative z-10 w-full max-w-md rounded-xl shadow-xl border ${border}`}>
        <div className="p-5 border-b border-gray-700/40">
          <h3 className="text-lg font-semibold">Edit Deposit</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm mb-1">Amount</label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Method (optional)</label>
            <input
              type="text"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="UPI / Bank / Wallet"
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        </div>
        <div className="p-5 flex justify-end gap-3 border-t border-gray-700/40">
          <button onClick={onCancel} className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDepositModal;

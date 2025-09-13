import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDarkMode = false,
}) => {
  if (!open) return null;

  const bg = isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const border = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${bg} relative z-10 w-full max-w-md rounded-xl shadow-xl border ${border}`}
      >
        <div className="p-5 border-b border-gray-700/40">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {message && (
          <div className="p-5 text-sm opacity-90">{message}</div>
        )}
        <div className="p-5 flex justify-end gap-3 border-t border-gray-700/40">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

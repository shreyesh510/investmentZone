import { memo } from 'react';
import Toast from './toast';
import { useToast } from '../../contexts/toastContext';

const ToastContainer = memo(function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          senderName={toast.senderName}
          type={toast.type}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
});

export default ToastContainer;

import React from 'react';
import CloseIcon from './icons/CloseIcon';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

interface ToastNotificationsProps {
  toasts: Toast[];
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>;
}

const typeClasses = {
  info: {
    bg: 'bg-blue-500',
    iconBg: 'bg-blue-600',
  },
  success: {
    bg: 'bg-green-500',
    iconBg: 'bg-green-600',
  },
  error: {
    bg: 'bg-red-500',
    iconBg: 'bg-red-600',
  },
};

const Toast: React.FC<{ toast: Toast; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  const { id, message, type, Icon } = toast;
  const classes = typeClasses[type];

  return (
    <div
      className={`relative w-full max-w-sm rounded-lg shadow-2xl overflow-hidden animate-toast-in ${classes.bg}`}
      role="alert"
    >
      <div className="p-4 flex items-start text-white">
        <div className={`p-2 rounded-full ${classes.iconBg} mr-3 flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-grow text-sm font-medium">{message}</div>
        <button
          onClick={() => onDismiss(id)}
          className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
          aria-label="Cerrar notificación"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-toast-timer"></div>
    </div>
  );
};


const ToastNotifications: React.FC<ToastNotificationsProps> = ({ toasts, setToasts }) => {
  const handleDismiss = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <>
      <div
        aria-live="assertive"
        className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
      >
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
          ))}
        </div>
      </div>
       <style>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-toast-in {
          animation: toast-in 0.5s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
        }

        @keyframes toast-timer {
            from { width: 100%; }
            to { width: 0%; }
        }
        .animate-toast-timer {
            animation: toast-timer 5s linear forwards;
        }
      `}</style>
    </>
  );
};

export default ToastNotifications;
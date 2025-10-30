import React from 'react';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}) => {
  if (!isOpen) {
    return null;
  }

  // Effect to handle Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 transform transition-all duration-300 scale-100"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="confirmation-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{message}</p>
        <div className="mt-6 flex flex-col sm:flex-row-reverse sm:space-x-4 sm:space-x-reverse gap-3">
          <Button onClick={onConfirm} className="w-full sm:w-auto">
            {confirmText}
          </Button>
          <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

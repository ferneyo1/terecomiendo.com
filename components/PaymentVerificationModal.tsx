import React, { useState } from 'react';
import Button from './Button';
import CloseIcon from './icons/CloseIcon';
import { type UserProfile } from '../types';

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (uid: string, isApproved: boolean) => Promise<void>;
  userProfile: UserProfile | null;
  planName: string;
}

const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({ isOpen, onClose, onVerify, userProfile, planName }) => {
    const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

    if (!isOpen || !userProfile) return null;

    const handleApprove = async () => {
        setLoading('approve');
        await onVerify(userProfile.uid, true);
        setLoading(null);
    };
    
    const handleReject = async () => {
        setLoading('reject');
        await onVerify(userProfile.uid, false);
        setLoading(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg"
                role="dialog" aria-modal="true" aria-labelledby="verify-modal-title"
                onClick={e => e.stopPropagation()}
            >
                 <div className="relative p-6 sm:p-8">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
                        aria-label="Cerrar modal"
                    >
                        <CloseIcon />
                    </button>
                    <h2 id="verify-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verificar Pago de Membresía</h2>
                    <div className="text-gray-600 dark:text-gray-300 mb-6">
                        <p className="font-medium text-lg">{userProfile.fullName || userProfile.email}</p>
                        <p className="text-sm">{userProfile.email}</p>
                        <p className="text-sm mt-1">Plan: <span className="font-semibold">{planName}</span></p>
                    </div>
                    <div className="mt-6 space-y-4">
                        {userProfile.membership?.paymentReceiptUrl ? (
                            <a 
                                href={userProfile.membership.paymentReceiptUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-block w-full text-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Ver Comprobante de Pago
                            </a>
                        ) : (
                            <p className="text-center text-red-500 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                No se encontró comprobante de pago para este usuario.
                            </p>
                        )}
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                            Confirma que has recibido el pago correspondiente a la membresía antes de aprobar. Esta acción es irreversible.
                        </p>
                        <div className="flex justify-end pt-4 gap-3">
                            <Button onClick={handleReject} variant="secondary" disabled={!!loading} className="!bg-red-100 !text-red-800 hover:!bg-red-200 dark:!bg-red-900/50 dark:!text-red-300 dark:hover:!bg-red-900">
                                {loading === 'reject' ? 'Rechazando...' : 'Rechazar'}
                            </Button>
                            <Button onClick={handleApprove} disabled={!!loading} className="!bg-green-600 hover:!bg-green-700 focus:!ring-green-500">
                                {loading === 'approve' ? 'Aprobando...' : 'Aprobar Pago'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PaymentVerificationModal;
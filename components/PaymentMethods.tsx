import React, { useState, useRef } from 'react';
import { type User, uploadPaymentReceipt, updateUserProfile } from '../services/firebase';
import { type UserProfile, type Membership } from '../types';
import Button from './Button';
import ClockIcon from './icons/ClockIcon';

interface PaymentMethodsProps {
    user: User;
    userProfile: UserProfile;
    onProfileUpdate: (updatedData: Partial<UserProfile>) => void;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ user, userProfile, onProfileUpdate }) => {
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setFeedback({ type: 'error', text: 'El archivo es demasiado grande. Máximo 5MB.' });
                return;
            }
            setReceiptFile(file);
            setFeedback(null);
        }
    };
    
    const handleSubmitReceipt = async () => {
        if (!receiptFile) {
            setFeedback({ type: 'error', text: 'Por favor, selecciona un archivo de comprobante.' });
            return;
        }
        
        setLoading(true);
        setUploadProgress(0);
        setFeedback(null);

        try {
            const receiptUrl = await uploadPaymentReceipt(user.uid, receiptFile, setUploadProgress);
            setUploadProgress(null); // Upload finished, now updating DB
            
            const updatedMembership: Membership = {
                ...(userProfile.membership!),
                status: 'pending_verification',
                paymentReceiptUrl: receiptUrl,
            };

            await updateUserProfile(user.uid, { membership: updatedMembership });
            onProfileUpdate({ membership: updatedMembership });

            setFeedback({ type: 'success', text: 'Comprobante enviado. El administrador lo revisará pronto.' });
            setReceiptFile(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', text: 'Error al enviar el comprobante. Inténtalo de nuevo.' });
        } finally {
            setLoading(false);
            setUploadProgress(null);
        }
    };
    
    const renderStatus = () => {
        const status = userProfile.membership?.status;
        if (status === 'pending_verification') {
            return (
                <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center gap-3">
                    <ClockIcon />
                    <span>Tu pago está pendiente de verificación. Recibirás una notificación cuando sea aprobado.</span>
                </div>
            );
        }
        return null;
    }

    return (
        <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Formas de Pago</h3>
            
            {renderStatus()}

            <div className="mt-6">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Pago en Línea</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Próximamente podrás pagar de forma segura con Interac, PayPal o tarjeta de crédito.</p>
                <div className="flex flex-wrap gap-4">
                    <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 font-medium">Interac</div>
                    <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 font-medium">PayPal</div>
                    <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 font-medium">Tarjeta</div>
                </div>
            </div>

            <div className="my-8 border-t border-gray-200 dark:border-gray-700"></div>
            
            <div>
                 <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Pago Manual y Verificación</h4>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Si ya realizaste el pago por otro medio, sube tu comprobante aquí para que un administrador lo verifique.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="!w-full sm:!w-auto">
                        Seleccionar Archivo
                    </Button>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-grow truncate">{receiptFile ? receiptFile.name : 'Ningún archivo seleccionado'}</span>
                </div>
                
                {feedback && (
                  <p className={`text-sm mt-4 text-center ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{feedback.text}</p>
                )}

                {loading && (
                    <div className="mt-4">
                        <p className="text-sm text-center text-gray-700 dark:text-gray-300 mb-2">
                            {uploadProgress !== null ? `Subiendo comprobante... ${Math.round(uploadProgress || 0)}%` : 'Procesando...'}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600 overflow-hidden">
                            {uploadProgress !== null ? (
                                <div 
                                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            ) : (
                                <div className="relative w-full h-full">
                                    <div className="absolute top-0 bottom-0 w-1/4 bg-indigo-600 rounded-full animate-indeterminate"></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-4">
                     <Button onClick={handleSubmitReceipt} disabled={!receiptFile || loading || userProfile.membership?.status === 'pending_verification'}>
                        {loading ? 'Enviando...' : 'Enviar Comprobante'}
                    </Button>
                </div>
            </div>
             <style>{`
                @keyframes indeterminate {
                    0% { left: -25%; }
                    100% { left: 100%; }
                }
                .animate-indeterminate {
                    animation: indeterminate 1.5s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};
export default PaymentMethods;
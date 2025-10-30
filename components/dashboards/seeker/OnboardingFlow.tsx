import React, { useState, useEffect, useRef } from 'react';
import { type User, unlockJobListing, getAppConfig, uploadResume, applyToJobListing } from '../../../services/firebase';
import { type UserProfile, type MembershipPlanDetails, type AppConfig } from '../../../types';
import ProfilePage from '../../ProfilePage';
import Button from '../../Button';
import DollarSignIcon from '../../icons/DollarSignIcon';
import ArrowUpCircleIcon from '../../icons/ArrowUpCircleIcon';
import CheckCircleIcon from '../../icons/CheckCircleIcon';
import PaymentModal from '../../PaymentModal';
import UploadIcon from '../../icons/UploadIcon';
import FileIcon from '../../icons/FileIcon';
import XCircleIcon from '../../icons/XCircleIcon';

interface OnboardingFlowProps {
    user: User;
    userProfile: UserProfile;
    onProfileUpdate: (updatedData: Partial<UserProfile>) => void;
    jobIdToUnlock: string;
    onUnlockAndApply: (jobId: string) => void;
    membershipPlans: MembershipPlanDetails[];
    setActiveView: (view: any) => void;
}

const Step: React.FC<{ stepNumber: number; label: string; currentStep: number }> = ({ stepNumber, label, currentStep }) => {
    const isActive = stepNumber === currentStep;
    const isComplete = stepNumber < currentStep;

    return (
        <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${
                isActive ? 'bg-indigo-600 text-white' : 
                isComplete ? 'bg-green-500 text-white' : 
                'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
            }`}>
                {isComplete ? <CheckCircleIcon className="w-5 h-5" /> : stepNumber}
            </div>
            <span className={`ml-3 font-semibold transition-colors duration-300 ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 
                isComplete ? 'text-gray-700 dark:text-gray-300' :
                'text-gray-500'
            }`}>
                {label}
            </span>
        </div>
    );
};


const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, userProfile, onProfileUpdate, jobIdToUnlock, onUnlockAndApply, membershipPlans, setActiveView }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isUnlocked, setIsUnlocked] = useState(userProfile.unlockedListings?.includes(jobIdToUnlock) || false);
    const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
    const [isProcessing, setIsProcessing] = useState(false); // For applying
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [applicationFeedback, setApplicationFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getAppConfig().then(setAppConfig);
        // If job is already unlocked, skip to apply step, assuming profile is complete.
        if (isUnlocked) {
            setCurrentStep(3);
        }
    }, [isUnlocked]);
    
    useEffect(() => {
        // When profile updates from parent, check again if we should move forward
        if (userProfile.fullName && userProfile.address && userProfile.phoneNumber && currentStep === 1) {
            setCurrentStep(2);
        }
    }, [userProfile, currentStep]);


    const handleProfileStepComplete = (updatedData: Partial<UserProfile>) => {
        onProfileUpdate(updatedData);
        // Effect will handle moving to next step
    };

    const handleUnlock = async () => {
        try {
            await unlockJobListing(user.uid, jobIdToUnlock);
            onProfileUpdate({ unlockedListings: [...(userProfile.unlockedListings || []), jobIdToUnlock] });
            setIsUnlocked(true);
            setCurrentStep(3);
        } catch (error) {
            console.error("Failed to unlock job:", error);
            // Re-throw to let PaymentModal know it failed.
            throw new Error('Error al desbloquear. Inténtalo de nuevo.');
        }
    };

    const handleFileSelect = (file: File | undefined | null) => {
        if (!file) {
            setResumeFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const resetInvalidFile = () => {
            setResumeFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        };

        // 1. Size Validation
        const MAX_SIZE_MB = 5;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setApplicationFeedback({ type: 'error', text: `El archivo es demasiado grande. El tamaño máximo es de ${MAX_SIZE_MB}MB.` });
            resetInvalidFile();
            return;
        }
        
        // 2. Extension and MIME Type Validation
        const allowedExtensions = /(\.pdf|\.doc|\.docx)$/i;
        const allowedMimeTypes = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!allowedExtensions.test(file.name) || !allowedMimeTypes.includes(file.type)) {
            setApplicationFeedback({ type: 'error', text: 'Tipo de archivo no válido. Solo se aceptan archivos PDF, DOC y DOCX.' });
            resetInvalidFile();
            return;
        }

        setResumeFile(file);
        setApplicationFeedback(null);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files?.[0]);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleApply = async () => {
        if (!resumeFile) {
            setApplicationFeedback({ type: 'error', text: 'Por favor, selecciona tu hoja de vida.' });
            return;
        }
        setIsProcessing(true);
        setUploadProgress(0);
        setApplicationFeedback(null);
        try {
            const resumeUrl = await uploadResume(
                jobIdToUnlock,
                user.uid,
                resumeFile,
                (progress) => setUploadProgress(progress)
            );
            await applyToJobListing(jobIdToUnlock, userProfile, resumeUrl);
            setApplicationFeedback({ type: 'success', text: '¡Postulación enviada con éxito! Hemos enviado un correo a la empresa con tu perfil y CV, y notificado al recomendador. Puedes hacer seguimiento desde "Mis Postulaciones".' });
        } catch (error: any) {
            setApplicationFeedback({ type: 'error', text: error.message || 'No se pudo enviar tu postulación. Inténtalo de nuevo.' });
        } finally {
            setIsProcessing(false);
            setUploadProgress(0);
        }
    };

    if (applicationFeedback?.type === 'success') {
        return (
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 text-center animate-fade-in">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-4 mb-2">¡Postulación Enviada!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">{applicationFeedback.text}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button onClick={() => onUnlockAndApply(jobIdToUnlock)} variant="secondary">Ver Publicación</Button>
                    <Button onClick={() => setActiveView('myApplications')}>Ir a Mis Postulaciones</Button>
                </div>
             </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">¡Bienvenido a TeRecomiendo!</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Sigue estos pasos para completar tu postulación.</p>
            </div>
            
            <div className="flex items-start justify-center mb-8">
                <Step stepNumber={1} label="Completa tu Perfil" currentStep={currentStep} />
                <div className="h-0.5 w-8 sm:w-16 bg-gray-300 dark:bg-gray-600 mt-4 mx-2"></div>
                <Step stepNumber={2} label="Desbloquea la Oferta" currentStep={currentStep} />
                 <div className="h-0.5 w-8 sm:w-16 bg-gray-300 dark:bg-gray-600 mt-4 mx-2"></div>
                <Step stepNumber={3} label="Envía Postulación" currentStep={currentStep} />
            </div>

            {currentStep === 1 && (
                 <div className="animate-fade-in">
                    <h2 className="text-xl font-semibold text-center mb-4">Primero, necesitamos algunos datos</h2>
                    <ProfilePage 
                        user={user}
                        userProfile={userProfile}
                        onProfileUpdate={handleProfileStepComplete}
                        onDirtyChange={() => {}}
                        membershipPlans={membershipPlans}
                        userRole={userProfile.role}
                    />
                 </div>
            )}
            
            {currentStep === 2 && (
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 text-center animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">¡Ya casi! Elige una opción para continuar</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">Puedes obtener acceso a todas las publicaciones con una membresía o desbloquear solo esta oferta.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center">
                           <ArrowUpCircleIcon />
                           <h3 className="text-lg font-semibold my-3">Comprar Membresía</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow mb-4">Acceso ilimitado a todas las publicaciones, soporte prioritario y más beneficios.</p>
                           <Button onClick={() => setActiveView('upgradeMembership')} variant="secondary" className="w-full">
                               Ver Planes
                           </Button>
                       </div>
                       <div className="p-6 border-2 border-indigo-500 rounded-lg flex flex-col items-center bg-indigo-50 dark:bg-indigo-900/20">
                           <DollarSignIcon className="w-6 h-6 text-indigo-500" />
                           <h3 className="text-lg font-semibold my-3">Desbloqueo Único</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow mb-4">Paga una pequeña tarifa para ver los detalles y postularte solo a esta oferta de empleo.</p>
                           <Button onClick={() => setShowPaymentModal(true)} disabled={!appConfig} className="w-full">
                               {`Pagar $${appConfig?.unlockFee || '...'} ahora`}
                           </Button>
                       </div>
                    </div>
                    <button onClick={() => setCurrentStep(1)} className="text-sm text-gray-500 hover:underline mt-8">
                        &larr; Volver a editar perfil
                    </button>
                 </div>
            )}

            {currentStep === 3 && (
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 text-center animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">¡Último paso! Envía tu Hoja de Vida</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">Carga tu CV o currículum en formato PDF, DOC o DOCX (máximo 5MB).</p>
                    
                    <div className="max-w-lg mx-auto">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            disabled={isProcessing}
                        />
                        
                        {resumeFile ? (
                            <div className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex items-center">
                                    <FileIcon className="w-10 h-10 text-indigo-500 flex-shrink-0" />
                                    <div className="ml-4 text-left flex-grow overflow-hidden">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={resumeFile.name}>
                                            {resumeFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    {!isProcessing && (
                                        <button 
                                            type="button" 
                                            onClick={() => handleFileSelect(null)} 
                                            className="ml-4 p-1 text-gray-400 hover:text-red-500 rounded-full"
                                            aria-label="Remove file"
                                        >
                                            <XCircleIcon className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                
                                {isProcessing && (
                                    <div className="mt-3">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                                {uploadProgress < 100 ? 'Subiendo...' : '¡Subido con éxito!'}
                                            </span>
                                            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                                {uploadProgress < 100 ? `${Math.round(uploadProgress)}%` : <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                                            <div 
                                                className={`h-2.5 rounded-full transition-all duration-300 ${uploadProgress === 100 ? 'bg-green-500' : 'bg-indigo-600'}`} 
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div
                                role="button"
                                tabIndex={0}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                                className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
                                    isDragging 
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                                aria-label="Área para subir archivo de currículum"
                            >
                                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-gray-200">
                                    Arrastra y suelta tu CV aquí
                                </span>
                                <span className="mt-1 block text-xs text-gray-500">
                                    o <span className="font-medium text-indigo-600 dark:text-indigo-400">haz clic para buscar en tu equipo</span>
                                </span>
                                 <span className="mt-2 block text-xs text-gray-500">
                                    PDF, DOC, DOCX (Max 5MB)
                                </span>
                            </div>
                        )}
                        
                        {applicationFeedback?.type === 'error' && (
                            <p className="text-sm text-red-500 mt-4">{applicationFeedback.text}</p>
                        )}
                        
                        <div className="mt-8">
                            <Button onClick={handleApply} disabled={!resumeFile || isProcessing} className="w-full max-w-xs mx-auto">
                                {isProcessing ? (uploadProgress < 100 ? 'Subiendo...' : 'Procesando...') : 'Enviar Postulación'}
                            </Button>
                        </div>
                    </div>
                 </div>
            )}

             {appConfig && <PaymentModal 
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={handleUnlock}
                amount={appConfig.unlockFee}
                itemDescription="Desbloqueo de publicación de empleo"
            />}

             <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default OnboardingFlow;
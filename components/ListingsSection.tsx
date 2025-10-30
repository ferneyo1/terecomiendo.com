import React, { useState, useEffect, useRef } from 'react';
import { getListings, applyToJobListing, unlockJobListing, getAppConfig, type User, uploadResume } from '../services/firebase';
import { type Listing, type JobListing, type ProfessionalListing, type UserProfile, type AppConfig } from '../types';
import ListingCard from './ListingCard';
import Button from './Button';
import Avatar from './Avatar';
import StarIcon from './icons/StarIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import CloseIcon from './icons/CloseIcon';
import LocationIcon from './icons/LocationIcon';
import PhoneIcon from './icons/PhoneIcon';
import ClockIcon from './icons/ClockIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import AtIcon from './icons/AtIcon';
import LockIcon from './icons/LockIcon';
import PaymentModal from './PaymentModal';

const PublicListingDetailModal: React.FC<{
  listing: ProfessionalListing | null;
  onClose: () => void;
}> = ({ listing, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!listing) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [listing, onClose]);
    
    if (!listing) return null;

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <StarIcon
                    key={i}
                    className={`w-5 h-5 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                />
            );
        }
        return stars;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="listing-details-title"
            >
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                            <Avatar avatarUrl={listing.professionalAvatarUrl} size={56} />
                            <div className="ml-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{listing.professionalName}</h3>
                                {listing.isProfessionalVerified && (
                                    <div className="flex items-center text-sm text-teal-600 dark:text-teal-400 font-medium mt-1">
                                        <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                                        <span>Profesional Verificado</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            aria-label="Cerrar modal"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <img src={listing.imageUrl || `https://source.unsplash.com/random/600x400?service&id=${listing.id}`} alt={listing.serviceTitle} className="w-full h-64 object-cover rounded-lg mb-6" />

                    <h2 id="listing-details-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{listing.serviceTitle}</h2>
                    <div className="flex items-center mb-4">
                        {renderStars(listing.rating)}
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {listing.rating.toFixed(1)}
                            <span className="ml-1">({listing.totalRatings} reseñas)</span>
                        </span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Detalles del Servicio</h4>
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{listing.serviceDetails}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div>
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Precio</h4>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">${listing.price} <span className="text-base font-normal text-gray-500 dark:text-gray-400">/ {listing.priceType === 'per_hour' ? 'hora' : 'trabajo'}</span></p>
                            </div>
                            <div className="flex items-start">
                                <ClockIcon className="w-5 h-5 text-gray-400" />
                                <div className="ml-3">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Disponibilidad</h4>
                                    <p className="text-gray-600 dark:text-gray-400">{listing.availability}</p>
                                </div>
                            </div>
                             <div className="flex items-start">
                                {/* Fix: Pass className to LocationIcon as it no longer has a hardcoded className */}
                                <LocationIcon className="w-5 h-5 text-gray-400" />
                                <div className="ml-3">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Dirección</h4>
                                    <p className="text-gray-600 dark:text-gray-400">{listing.address}</p>
                                </div>
                            </div>
                             <div className="flex items-start">
                                <PhoneIcon />
                                <div className="ml-3">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Teléfono</h4>
                                    <p className="text-gray-600 dark:text-gray-400">{listing.phoneNumber}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="mt-8 flex flex-col sm:flex-row-reverse items-center gap-3">
                        <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">Cerrar</Button>
                        <a href={`tel:${listing.phoneNumber}`} className="w-full sm:w-auto">
                            <Button className="w-full">
                                Llamar ahora
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
            <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};


const PublicJobDetailModal: React.FC<{
  listing: JobListing | null;
  user: User | null;
  userProfile: UserProfile | null;
  onClose: () => void;
  onLoginRequest: (jobId: string) => void;
  onProfileUpdate: (data: Partial<UserProfile>) => void;
  onStartOnboarding: (jobId: string) => void;
}> = ({ listing, user, userProfile, onClose, onLoginRequest, onProfileUpdate, onStartOnboarding }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [applicationFeedback, setApplicationFeedback] = useState<{type: 'success'|'error', text: string} | null>(null);
    const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    // Fix: Add uploadProgress state to track file upload progress for the resume.
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (listing) {
            getAppConfig().then(config => {
                setAppConfig(config);
                setLoadingConfig(false);
            });
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [listing, onClose]);

    if (!listing) return null;

    const isPaidMember = userProfile?.membership?.status === 'active' && !!userProfile.membership.expiresAt;
    const hasUnlocked = userProfile?.unlockedListings?.includes(listing.id);
    const isUnlocked = !!user && (isPaidMember || hasUnlocked);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
    
            const resetInvalidFile = () => {
                setResumeFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            };
    
            const MAX_SIZE_MB = 5;
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                setApplicationFeedback({ type: 'error', text: `El archivo es demasiado grande (máx ${MAX_SIZE_MB}MB).` });
                resetInvalidFile();
                return;
            }
    
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
        }
    };

    const handleApply = async () => {
        if (!user || !userProfile) { onLoginRequest(listing.id); return; }
        
        const isProfileComplete = userProfile.fullName && userProfile.address && userProfile.phoneNumber;
        if (!isProfileComplete) {
            onClose();
            onStartOnboarding(listing.id);
            return;
        }

        if (!isUnlocked || !resumeFile) return;

        setIsApplying(true);
        // Fix: Reset upload progress when starting a new application.
        setUploadProgress(0);
        setApplicationFeedback(null);
        try {
            // Fix: Pass the missing `onProgress` callback to `uploadResume` to handle upload progress.
            const resumeUrl = await uploadResume(listing.id, user.uid, resumeFile, (progress) => setUploadProgress(progress));
            await applyToJobListing(listing.id, userProfile, resumeUrl);
            setApplicationFeedback({ type: 'success', text: '¡Te has postulado con éxito!' });
            setResumeFile(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
        } catch(error: any) {
            setApplicationFeedback({ type: 'error', text: error.message || 'Error al postularse. Inténtalo de nuevo.' });
        } finally {
            setIsApplying(false);
            // Fix: Reset upload progress after application attempt.
            setUploadProgress(0);
        }
    };
    
    const handlePaymentConfirm = async () => {
        if (!user) { 
            onLoginRequest(listing.id); 
            throw new Error("Usuario no autenticado.");
        }
        
        try {
            await unlockJobListing(user.uid, listing.id);
            onProfileUpdate({ unlockedListings: [...(userProfile?.unlockedListings || []), listing.id] });
        } catch(error: any) {
            setApplicationFeedback({ type: 'error', text: 'Error al desbloquear. Inténtalo de nuevo.' });
            throw error; // Re-throw to notify PaymentModal of failure
        }
    }

    const hasApplied = user && listing.applicants?.includes(user.uid);
    const isFull = (listing.applicantCount || 0) >= 20;
    const hasSuccessfullyApplied = hasApplied || applicationFeedback?.type === 'success';
    const canApply = isUnlocked && !hasSuccessfullyApplied && !isFull;
    const salaryText = listing.salary ? `$${listing.salary.value}` : 'A convenir';
    const salaryTypeText = listing.salary ? `/ ${listing.salary.type === 'per_hour' ? 'hora' : 'año'}` : '';

    const handleUnlockClick = () => {
        if (!user || !userProfile) {
            onLoginRequest(listing.id);
            return;
        }

        const isProfileComplete = userProfile.fullName && userProfile.address && userProfile.phoneNumber;

        if (!isProfileComplete) {
            onClose();
            onStartOnboarding(listing.id);
        } else {
            setShowPaymentModal(true);
        }
    };

    const LockedContent = () => (
        <div className="my-6 p-6 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-center">
            <LockIcon />
            <h4 className="font-semibold text-lg text-gray-800 dark:text-white mt-2">Información de Contacto Bloqueada</h4>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Para ver los detalles completos de la empresa y postularte, desbloquea esta publicación.</p>
            {loadingConfig ? <div className="h-10 mt-4"></div> : (
                <Button onClick={handleUnlockClick} className="mt-4">
                    {`Desbloquear por $${appConfig?.unlockFee || '...'}`}
                </Button>
            )}
        </div>
    );


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="job-details-title"
            >
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                            <Avatar avatarUrl={listing.recommenderAvatarUrl} size={56} />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Recomendado por:</p>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{listing.recommenderName}</h3>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            aria-label="Cerrar modal"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <h2 id="job-details-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{listing.jobTitle}</h2>
                    
                    {isUnlocked && listing.companyName && <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-4">{listing.companyName}</p>}

                    <div className="space-y-6">
                        {listing.jobDetails && (
                             <div>
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Detalles del Empleo</h4>
                                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{listing.jobDetails}</p>
                            </div>
                        )}
                       
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div>
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Salario</h4>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                    {salaryText} 
                                    {salaryTypeText && <span className="text-base font-normal text-gray-500 dark:text-gray-400">{salaryTypeText}</span>}
                                </p>
                            </div>
                             {isUnlocked && listing.address && (
                                <div className="flex items-start">
                                    <LocationIcon className="w-5 h-5 text-gray-400" />
                                    <div className="ml-3">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Ubicación</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{listing.address}</p>
                                    </div>
                                </div>
                             )}
                             {isUnlocked && (
                                <>
                                 <div className="flex items-start">
                                    <PhoneIcon />
                                    <div className="ml-3">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Contacto</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{listing.contactPerson}</p>
                                        <p className="text-gray-600 dark:text-gray-400">{listing.areaCode && `(${listing.areaCode}) `}{listing.contactPhone}</p>
                                    </div>
                                </div>
                                 <div className="flex items-start">
                                    <AtIcon />
                                    <div className="ml-3">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Correo</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{listing.contactEmail}</p>
                                    </div>
                                </div>
                                </>
                             )}
                        </div>
                        {!isUnlocked && <LockedContent />}
                        
                         {canApply && (
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Aplicar a esta vacante</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sube tu hoja de vida en formato PDF o Word (máx 5MB).</p>
                                
                                <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx"
                                        className="hidden"
                                        disabled={isApplying}
                                    />
                                    <Button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()} 
                                        variant="secondary" 
                                        className="!w-full sm:!w-auto"
                                        disabled={isApplying}>
                                        Seleccionar Archivo
                                    </Button>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-grow truncate">
                                        {resumeFile ? resumeFile.name : 'Ningún archivo seleccionado'}
                                    </span>
                                </div>
                                {/* Fix: Add a progress bar to show upload progress. */}
                                {isApplying && uploadProgress > 0 && (
                                    <div className="mt-3">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                                Subiendo...
                                            </span>
                                            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                                {Math.round(uploadProgress)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                                            <div 
                                                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                     <div className="mt-8 flex flex-col sm:flex-row-reverse items-center gap-3">
                        <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">Cerrar</Button>
                        {canApply && (
                            <div className="w-full sm:w-auto">
                                <Button className="w-full" onClick={handleApply} disabled={isApplying || !resumeFile}>
                                    {isApplying ? 'Postulando...' : 'Postularse ahora'}
                                </Button>
                            </div>
                        )}
                        {hasSuccessfullyApplied && (
                            <div className="w-full sm:w-auto">
                                <Button className="w-full" disabled={true}>
                                    Postulación Enviada
                                </Button>
                            </div>
                        )}
                         {isFull && !hasSuccessfullyApplied && (
                            <div className="w-full sm:w-auto">
                                <Button className="w-full" disabled={true}>
                                    Vacantes Llenas
                                </Button>
                            </div>
                        )}
                    </div>
                    {applicationFeedback && (
                        <p className={`text-sm mt-4 text-center ${applicationFeedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{applicationFeedback.text}</p>
                    )}
                </div>
            </div>
            {appConfig && <PaymentModal 
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={handlePaymentConfirm}
                amount={appConfig.unlockFee}
                itemDescription={`Desbloqueo para: ${listing.jobTitle}`}
            />}
            <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};


const ListingsSection: React.FC<{
    user?: User | null, 
    userProfile?: UserProfile | null,
    onLoginRequest?: (jobId?: string) => void,
    onProfileUpdate?: (data: Partial<UserProfile>) => void,
    jobToAutoOpen?: string | null,
    onAutoOpenDone?: () => void,
    onStartOnboarding: (jobId: string) => void;
}> = ({ user, userProfile, onLoginRequest = () => {}, onProfileUpdate = () => {}, jobToAutoOpen, onAutoOpenDone = () => {}, onStartOnboarding }) => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const fetchedListings = await getListings();
                setListings(fetchedListings);

                if (jobToAutoOpen) {
                    const listingToOpen = fetchedListings.find(l => l.id === jobToAutoOpen);
                    if (listingToOpen) {
                        setSelectedListing(listingToOpen);
                        onAutoOpenDone();
                    }
                }

            } catch (error) {
                console.error("Error fetching listings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [jobToAutoOpen, onAutoOpenDone]);

    return (
        <section className="bg-white dark:bg-gray-800 py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Oportunidades Recomendadas
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Encuentra servicios y empleos de confianza ofrecidos por miembros de nuestra comunidad.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
                    </div>
                ) : listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {listings.map(listing => (
                            <ListingCard 
                                key={listing.id} 
                                listing={listing} 
                                onViewDetails={() => setSelectedListing(listing)}
                                user={user}
                                onLoginRequest={onLoginRequest}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                        <p>Aún no hay publicaciones. ¡Vuelve pronto!</p>
                    </div>
                )}
            </div>
            
            {selectedListing?.listingType === 'professional' && 
                <PublicListingDetailModal listing={selectedListing as ProfessionalListing} onClose={() => setSelectedListing(null)} />
            }
            {selectedListing?.listingType === 'job' && 
                <PublicJobDetailModal 
                    listing={selectedListing as JobListing} 
                    user={user || null}
                    userProfile={userProfile || null}
                    onClose={() => setSelectedListing(null)} 
                    onLoginRequest={onLoginRequest}
                    onProfileUpdate={onProfileUpdate}
                    onStartOnboarding={onStartOnboarding}
                />
            }
        </section>
    );
};

export default ListingsSection;
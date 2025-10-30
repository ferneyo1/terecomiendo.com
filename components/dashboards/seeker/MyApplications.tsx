import React, { useState, useEffect, useCallback } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { type User, getAppliedJobsForSeeker, updateJobListing } from '../../../services/firebase';
import { type JobListing, type ApplicationStatus } from '../../../types';
import RatingModal from './RatingModal';
import Avatar from '../../Avatar';
import StarIcon from '../../icons/StarIcon';
import Button from '../../Button';
import ChevronDownIcon from '../../icons/ChevronDownIcon';
import BriefcaseIcon from '../../icons/BriefcaseIcon';
import DollarSignIcon from '../../icons/DollarSignIcon';
import LocationIcon from '../../icons/LocationIcon';
import EyeIcon from '../../icons/EyeIcon';
import CheckCircleIcon from '../../icons/CheckCircleIcon';
import XCircleIcon from '../../icons/XCircleIcon';
import PaperAirplaneIcon from '../../icons/PaperAirplaneIcon';
import ToastNotifications from '../../ToastNotifications';

interface MyApplicationsProps {
  user: User;
}

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const getStatusInfo = (job: JobListing, userId: string) => {
    const appStatus = job.applicantStatuses?.[userId]?.status;

    switch (appStatus) {
        case 'viewed':
            return { text: 'Vista', color: 'blue', Icon: EyeIcon, toastType: 'info' as const };
        case 'shortlisted':
            return { text: 'Preseleccionado', color: 'purple', Icon: CheckCircleIcon, toastType: 'success' as const };
        case 'rejected':
            return { text: 'No Seleccionado', color: 'red', Icon: XCircleIcon, toastType: 'error' as const };
        case 'applied':
        default:
            return { text: 'Enviada', color: 'gray', Icon: PaperAirplaneIcon, toastType: 'info' as const };
    }
};


const MyApplications: React.FC<MyApplicationsProps> = ({ user }) => {
    const [applications, setApplications] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [ratingListing, setRatingListing] = useState<JobListing | null>(null);
    const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type'], Icon: Toast['Icon']) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, Icon }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000); // Toast visible for 5 seconds
    }, []);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const appliedJobs = await getAppliedJobsForSeeker(user.uid);

            const jobsToUpdate = appliedJobs.filter(
                job => job.applicantStatuses?.[user.uid]?.status === 'applied'
            );

            if (jobsToUpdate.length > 0) {
                const updatePromises = jobsToUpdate.map(job => {
                    const updatePath = {
                        [`applicantStatuses.${user.uid}.status`]: 'viewed',
                        [`applicantStatuses.${user.uid}.updatedAt`]: firebase.firestore.FieldValue.serverTimestamp(),
                    };
                    return updateJobListing(job.id, updatePath);
                });
                
                await Promise.all(updatePromises);
                
                const updatedJobs = appliedJobs.map(job => {
                    if (jobsToUpdate.some(j => j.id === job.id)) {
                        // Show toast for this change
                        addToast(
                            `Tu postulación para "${job.jobTitle}" ha sido vista.`,
                            'info',
                            EyeIcon
                        );
                        // Return the updated job for local state
                        return {
                            ...job,
                            applicantStatuses: {
                                ...job.applicantStatuses,
                                [user.uid]: {
                                    ...job.applicantStatuses?.[user.uid],
                                    // Fix: Cast the status string to ApplicationStatus to resolve the type error.
                                    status: 'viewed' as ApplicationStatus,
                                }
                            }
                        };
                    }
                    return job;
                });
                setApplications(updatedJobs);
            } else {
                setApplications(appliedJobs);
            }
        } catch (error) {
            console.error("Error fetching or updating applications:", error);
            addToast("Error al actualizar tus postulaciones.", "error", XCircleIcon);
        } finally {
            setLoading(false);
        }
    }, [user.uid, addToast]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);
    
    const handleRatingSuccess = (jobId: string) => {
        setApplications(prev => 
            prev.map(app => 
                app.id === jobId ? { ...app, ratedBy: [...(app.ratedBy || []), user.uid] } : app
            )
        );
        setRatingListing(null);
    };

    const toggleDetails = (jobId: string) => {
        setExpandedApplicationId(prevId => (prevId === jobId ? null : jobId));
    };
    
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        gray: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
    };
    
    const filteredApplications = applications.filter(job => {
        if (statusFilter === 'all') return true;
        const appStatus = job.applicantStatuses?.[user.uid]?.status;
        return appStatus === statusFilter;
    });

    return (
        <>
        <ToastNotifications toasts={toasts} setToasts={setToasts} />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Mis Postulaciones</h1>
            {loading ? (
                 <div className="flex items-center justify-center h-48">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
                </div>
            ) : applications.length > 0 ? (
                <>
                    <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filtrar por estado:</span>
                        {(['all', 'applied', 'viewed', 'shortlisted', 'rejected'] as const).map(status => {
                            const statusTextMap: Record<typeof status, string> = {
                                all: 'Todas',
                                applied: 'Enviadas',
                                viewed: 'Vistas',
                                shortlisted: 'Preseleccionadas',
                                rejected: 'No Seleccionadas',
                            };
                            const count = status === 'all' 
                                ? applications.length 
                                : applications.filter(job => job.applicantStatuses?.[user.uid]?.status === status).length;
                            
                            if (count === 0 && status !== 'all') return null;

                            return (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                                        statusFilter === status
                                            ? 'bg-indigo-600 text-white shadow'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <span>{statusTextMap[status]}</span>
                                    <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                                        statusFilter === status
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                    {filteredApplications.length > 0 ? (
                        <div className="space-y-4">
                            {filteredApplications.map(job => {
                                const hasRated = job.ratedBy?.includes(user.uid);
                                const isExpanded = expandedApplicationId === job.id;
                                const statusInfo = getStatusInfo(job, user.uid);

                                return (
                                    <div key={job.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-md">
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] md:grid-cols-[3fr_1.5fr_1fr] items-center gap-4">
                                            {/* Columna de Información del Empleo */}
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{job.jobTitle}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">en {job.companyName || 'Empresa Confidencial'}</p>
                                                <div className="flex items-center mt-2">
                                                    <Avatar avatarUrl={job.recommenderAvatarUrl} size={24} />
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 ml-2">Recomendado por <span className="font-medium">{job.recommenderName}</span></p>
                                                </div>
                                            </div>

                                            {/* Columna de Estado */}
                                            <div className="flex justify-start sm:justify-center">
                                                 <div className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${colorClasses[statusInfo.color as keyof typeof colorClasses]}`}>
                                                    <statusInfo.Icon className="w-4 h-4" />
                                                    <span>{statusInfo.text}</span>
                                                </div>
                                            </div>

                                            {/* Columna de Acciones */}
                                            <div className="flex flex-col sm:items-end gap-2">
                                                 {hasRated ? (
                                                    <div className="flex items-center text-green-600 dark:text-green-400 font-semibold text-sm px-3 py-1.5">
                                                        <StarIcon className="w-5 h-5 mr-1" />
                                                        Calificado
                                                    </div>
                                                ) : (
                                                    <Button onClick={() => setRatingListing(job)} variant="secondary" className="!w-full sm:!w-auto !py-1 !px-3 !text-sm">
                                                        Calificar
                                                    </Button>
                                                )}
                                                <Button 
                                                    onClick={() => toggleDetails(job.id)} 
                                                    variant="secondary" 
                                                    className="!w-full sm:!w-auto !py-1 !px-3 !text-sm flex items-center justify-center gap-1.5"
                                                    aria-expanded={isExpanded}
                                                    aria-controls={`details-${job.id}`}
                                                >
                                                    <span>Detalles</span>
                                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </Button>
                                            </div>
                                        </div>
                                        {isExpanded && (
                                            <div 
                                                id={`details-${job.id}`}
                                                className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600 space-y-3 animate-slide-down"
                                            >
                                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-3">Detalles del Empleo:</h4>
                                                
                                                {job.jobDetails && (
                                                    <div className="flex items-start text-sm">
                                                        <BriefcaseIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{job.jobDetails}</p>
                                                    </div>
                                                )}

                                                {job.salary && (
                                                   <div className="flex items-start text-sm">
                                                        <DollarSignIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                                        <p className="text-gray-600 dark:text-gray-300">
                                                            Salario: ${job.salary.value} / {job.salary.type === 'per_hour' ? 'hora' : 'año'}
                                                        </p>
                                                   </div>
                                                )}
                                                
                                                {job.address && (
                                                   <div className="flex items-start text-sm">
                                                        <LocationIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                                        <p className="text-gray-600 dark:text-gray-300">Ubicación: {job.address}</p>
                                                   </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                No tienes postulaciones con este estado
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Prueba a seleccionar otro filtro.
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        No tienes postulaciones
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Cuando te postules a un empleo, aparecerá aquí.
                    </p>
                </div>
            )}
            
            {ratingListing && (
                <RatingModal
                    isOpen={!!ratingListing}
                    onClose={() => setRatingListing(null)}
                    jobListing={ratingListing}
                    user={user}
                    onRatingSuccess={handleRatingSuccess}
                />
            )}
            <style>{`
                @keyframes slide-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-down {
                    animation: slide-down 0.3s ease-out forwards;
                }
            `}</style>
        </div>
        </>
    );
};

export default MyApplications;

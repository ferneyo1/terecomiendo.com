import React, { useState, useEffect, useCallback, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
// Fix: Import User type from local firebase service to fix module resolution error.
import type { User } from '../../services/firebase';
import {
  getMembershipPlans,
  getAllUsers,
  updateUserProfile,
  deleteUserProfile,
  getAllListings,
  updateListing,
  deleteListing,
  updateJobListing,
  deleteJobListing,
  getAppConfig,
  updateAppConfig,
} from '../../services/firebase';
import { type UserProfile, type MembershipPlanDetails, UserRole, type Membership, type ProfessionalListing, type JobListing, type Listing, type AppConfig } from '../../types';
import DashboardSidebar from './DashboardSidebar';
import ProfilePage from '../ProfilePage';
import ConfirmationModal from '../ConfirmationModal';
import MembershipPlanManagement from './MembershipPlanManagement';
import EditUserRoleModal from '../EditUserRoleModal';
import UserDetailsModal from '../UserDetailsModal';
import ManageMembershipModal from '../ManageMembershipModal';
import PaymentVerificationModal from '../PaymentVerificationModal';
import Button from '../Button';
import PencilIcon from '../icons/PencilIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import XCircleIcon from '../icons/XCircleIcon';
import NotificationBell from '../NotificationBell';
import CloseIcon from '../icons/CloseIcon';
import EyeIcon from '../icons/EyeIcon';
import TrashIcon from '../icons/TrashIcon';
import SearchIcon from '../icons/SearchIcon';
import SortAscendingIcon from '../icons/SortAscendingIcon';
import SortDescendingIcon from '../icons/SortDescendingIcon';
import Avatar from '../Avatar';
import DollarSignIcon from '../icons/DollarSignIcon';
import ClockIcon from '../icons/ClockIcon';
import LocationIcon from '../icons/LocationIcon';
import PhoneIcon from '../icons/PhoneIcon';
import BriefcaseIcon from '../icons/BriefcaseIcon';
import AtIcon from '../icons/AtIcon';
import CreditCardIcon from '../icons/CreditCardIcon';

type DashboardView = 'overview' | 'profile' | 'users' | 'listings' | 'membershipPlans' | 'paymentVerifications';

interface DashboardProps {
  user: User;
  userProfile: UserProfile;
  onLogout: () => void;
  onProfileUpdate: (updatedData: Partial<UserProfile>) => void;
  initialView: DashboardView;
}

const PaymentVerificationsManagement: React.FC<{
    users: UserProfile[];
    plans: MembershipPlanDetails[];
    onReview: (user: UserProfile) => void;
}> = ({ users, plans, onReview }) => {

    const getPlanName = (planId?: string) => {
        return plans.find(p => p.id === planId)?.name || 'Desconocido';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Verificaciones de Pago Pendientes</h1>
            {users.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map(user => (
                                <tr key={user.uid}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Avatar avatarUrl={user.avatarUrl} size={40} />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName || 'N/A'}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {getPlanName(user.membership?.planId)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <a href={user.membership?.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 text-sm font-medium">
                                            Ver
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button onClick={() => onReview(user)} className="!w-auto !py-1 !px-3 !text-xs">
                                            Revisar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    {/* Fix: Pass className to CreditCardIcon to resolve typing error. */}
                    <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay verificaciones pendientes</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Todo está al día. ¡Buen trabajo!</p>
                </div>
            )}
        </div>
    );
};


const statusInfo: Record<string, { text: string, color: string }> = {
  pending: { text: 'Pendiente', color: 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200' },
  verified: { text: 'Verificado', color: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' },
  rejected: { text: 'Rechazado', color: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' },
};


const ListingDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    listing: Listing | null;
    onApprove: (listing: Listing) => void;
    onReject: (listing: Listing) => void;
    approvingId?: string | null;
}> = ({ isOpen, onClose, listing, onApprove, onReject, approvingId }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !listing) return null;

    const isJob = listing.listingType === 'job';
    const job = isJob ? (listing as JobListing) : null;
    const prof = !isJob ? (listing as ProfessionalListing) : null;

    const title = prof?.serviceTitle || job?.jobTitle || 'Detalles';
    const salaryText = job?.salary ? `$${job.salary.value} / ${job.salary.type === 'per_hour' ? 'hora' : 'año'}` : 'A convenir';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="listing-details-title"
            >
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-start">
                        <h2 id="listing-details-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            aria-label="Cerrar modal"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                    
                    <div className="flex items-center mb-4">
                        <Avatar avatarUrl={prof?.professionalAvatarUrl || job?.recommenderAvatarUrl} size={48} />
                        <div className="ml-4">
                            <h3 className="text-base font-bold text-gray-800 dark:text-white">{prof?.professionalName || job?.recommenderName}</h3>
                             {prof?.isProfessionalVerified && (
                                <div className="flex items-center text-xs text-teal-600 dark:text-teal-400 font-medium mt-1">
                                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                                    <span>Profesional Verificado</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {prof?.imageUrl && <img src={prof.imageUrl} alt={prof.serviceTitle} className="w-full h-64 object-cover rounded-lg mb-6" />}

                    <div className="space-y-4">
                        <div>
                             <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${statusInfo[listing.status]?.color || 'bg-gray-200'}`}>
                                {statusInfo[listing.status]?.text || 'Desconocido'}
                            </span>
                        </div>
                        {listing.status === 'rejected' && listing.rejectionDetails && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/40 rounded-lg border border-red-200 dark:border-red-800">
                                <h4 className="font-semibold text-lg text-red-800 dark:text-red-200">Motivo del Rechazo</h4>
                                {listing.rejectionDetails.reasons.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Razones seleccionadas:</p>
                                        <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 pl-2 mt-1 space-y-1">
                                            {listing.rejectionDetails.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {listing.rejectionDetails.details && (
                                    <div className="mt-3">
                                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Detalles adicionales:</p>
                                        <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap mt-1">{listing.rejectionDetails.details}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
                           {prof && <>
                                <div className="flex items-start">
                                    <DollarSignIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Precio</h4>
                                        <p className="text-gray-600 dark:text-gray-400">${prof.price} / {prof.priceType === 'per_hour' ? 'hora' : 'trabajo'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <ClockIcon className="w-5 h-5 text-gray-400" />
                                    <div className="ml-3">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Disponibilidad</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{prof.availability}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <LocationIcon className="w-5 h-5 text-gray-400" />
                                    <div className="ml-3">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Dirección</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{prof.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <PhoneIcon />
                                    <div className="ml-3">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Teléfono</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{prof.phoneNumber}</p>
                                    </div>
                                </div>
                           </>}
                           {job && <>
                                {job.companyName && (
                                    <div className="flex items-start">
                                        <BriefcaseIcon />
                                        <div className="ml-3">
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-300">Empresa</h4>
                                            <p className="text-gray-600 dark:text-gray-400">{job.companyName}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start">
                                    <DollarSignIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Salario</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{salaryText}</p>
                                    </div>
                                </div>
                                {job.address && (
                                    <div className="flex items-start">
                                        <LocationIcon className="w-5 h-5 text-gray-400" />
                                        <div className="ml-3">
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-300">Dirección</h4>
                                            <p className="text-gray-600 dark:text-gray-400">{job.address}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start">
                                    <PhoneIcon />
                                    <div className="ml-3">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Teléfono de Contacto</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{job.contactPerson}</p>
                                        <p className="text-gray-600 dark:text-gray-400">{job.areaCode && `(${job.areaCode}) `}{job.contactPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start md:col-span-2">
                                    <AtIcon />
                                    <div className="ml-3">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Correo de Contacto</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{job.contactEmail}</p>
                                    </div>
                                </div>
                           </>}
                        </div>
                        { (prof?.serviceDetails || job?.jobDetails) &&
                            <div>
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300">Detalles</h4>
                                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{prof?.serviceDetails || job?.jobDetails}</p>
                            </div>
                        }
                    </div>
                     <div className="mt-8 flex flex-col sm:flex-row-reverse items-center gap-3">
                        <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">Cerrar</Button>
                         {listing.status === 'pending' && (
                            <>
                                <Button
                                    onClick={() => onApprove(listing)}
                                    disabled={approvingId === listing.id}
                                    className="!w-full sm:!w-auto !bg-green-500 hover:!bg-green-600 text-white flex items-center gap-1.5 justify-center"
                                >
                                    {approvingId === listing.id ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Aprobando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5"/>
                                            <span>Aprobar</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => onReject(listing)}
                                    className="!w-full sm:!w-auto !bg-red-500 hover:!bg-red-600 text-white flex items-center gap-1.5 justify-center"
                                >
                                    <XCircleIcon className="w-5 h-5"/>
                                    <span>Rechazar</span>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const REJECTION_REASONS = [
    'Información Incompleta o Confusa',
    'Imagen de Baja Calidad o Irrelevante',
    'Contenido Inapropiado o Prohibido',
    'Servicio no Válido o Spam',
    'Información de Contacto Inválida',
];

const RejectionModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (feedback: { reasons: string[], details: string }) => Promise<void>
}> = ({ isOpen, onClose, onConfirm }) => {
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [details, setDetails] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedReasons([]);
            setDetails('');
            setIsConfirming(false);
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

    const handleCheckboxChange = (reason: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedReasons(prev => [...prev, reason]);
        } else {
            setSelectedReasons(prev => prev.filter(r => r !== reason));
        }
    };

    const handleConfirmClick = async () => {
        if (selectedReasons.length === 0 && !details.trim()) {
            setError('Debes seleccionar al menos un motivo o proporcionar detalles.');
            return;
        }
        setIsConfirming(true);
        setError('');
        try {
            await onConfirm({ reasons: selectedReasons, details: details.trim() });
        } catch (e) {
            console.error(e);
            setError('No se pudo rechazar la publicación. Inténtelo de nuevo.');
            setIsConfirming(false);
        }
    }
    
    const isConfirmDisabled = (selectedReasons.length === 0 && details.trim() === '') || isConfirming;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div 
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative"
                role="dialog"
                aria-modal="true"
                aria-labelledby="rejection-modal-title"
            >
                 <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
                    aria-label="Cerrar modal"
                >
                    <CloseIcon />
                </button>
                <h2 id="rejection-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-200">Rechazar Publicación</h2>
                <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Selecciona uno o más motivos para el rechazo. Esto ayudará al usuario a mejorar su publicación.</p>
                    <div className="space-y-2 pt-2">
                        {REJECTION_REASONS.map(reason => (
                            <label key={reason} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedReasons.includes(reason)}
                                    onChange={(e) => handleCheckboxChange(reason, e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-gray-100 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-800 dark:text-gray-200">{reason}</span>
                            </label>
                        ))}
                    </div>
                
                    <div className="pt-2">
                        <label htmlFor="rejection-details" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                            Detalles Adicionales
                        </label>
                        <textarea
                            id="rejection-details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="w-full mt-1 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            rows={4}
                            placeholder="Escribe aquí tus comentarios..."
                            aria-describedby="rejection-details-description"
                        />
                        <p id="rejection-details-description" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Este campo es obligatorio si no se selecciona ningún motivo de la lista.
                        </p>
                    </div>
                </div>
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                <div className="mt-6 flex justify-end gap-3">
                    <Button onClick={onClose} variant="secondary" disabled={isConfirming}>Cancelar</Button>
                    <Button onClick={handleConfirmClick} disabled={isConfirmDisabled}>
                        {isConfirming ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Confirmando...
                            </>
                        ) : 'Confirmar Rechazo'}
                    </Button>
                </div>
            </div>
        </div>
    );
};


const UsersManagement: React.FC<{
    users: UserProfile[],
    onUsersUpdate: React.Dispatch<React.SetStateAction<UserProfile[]>>,
    showFeedback: (type: 'success' | 'error', text: string) => void,
    onViewDetails: (user: UserProfile) => void;
}> = ({ users, onUsersUpdate, showFeedback, onViewDetails }) => {
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [managingMembershipUser, setManagingMembershipUser] = useState<UserProfile | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const USERS_PER_PAGE = 10;

    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    const paginatedUsers = users.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);


    const handleUpdateUser = (uid: string, data: Partial<UserProfile>) => {
        onUsersUpdate(prev => prev.map(u => u.uid === uid ? { ...u, ...data } : u));
    };

    const handleSaveRole = async (uid: string, newRole: UserRole) => {
        await updateUserProfile(uid, { role: newRole });
        handleUpdateUser(uid, { role: newRole });
        setEditingUser(null);
    };

    const handleToggleActive = async (userToUpdate: UserProfile) => {
        const isActive = !(userToUpdate.isActive ?? true);
        await updateUserProfile(userToUpdate.uid, { isActive });
        handleUpdateUser(userToUpdate.uid, { isActive });
    };

    const handleSaveMembership = async (uid: string, newMembership: Membership) => {
        await updateUserProfile(uid, { membership: newMembership });
        handleUpdateUser(uid, { membership: newMembership });
        setManagingMembershipUser(null);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await deleteUserProfile(userToDelete.uid);
            onUsersUpdate(prev => prev.filter(u => u.uid !== userToDelete.uid));
            showFeedback('success', `Usuario ${userToDelete.email} eliminado.`);
        } catch (error) {
            console.error("Error deleting user:", error);
            showFeedback('error', 'Error al eliminar el usuario.');
        } finally {
            setUserToDelete(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Gestionar Usuarios</h1>
            <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membresía</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedUsers.map(user => (
                            <tr key={user.uid}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Avatar avatarUrl={user.avatarUrl} size={40} />
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName || 'N/A'}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => handleToggleActive(user)}
                                        className={`p-1.5 rounded-full transition-colors ${(user.isActive ?? true) ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50' : 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50'}`}
                                        aria-label={(user.isActive ?? true) ? 'Desactivar usuario' : 'Activar usuario'}
                                    >
                                        {(user.isActive ?? true) ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5" />}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.membership?.planId || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <Button onClick={() => onViewDetails(user)} variant="secondary" className="!w-auto !py-1 !px-2 !text-xs">
                                        <EyeIcon className="w-4 h-4" />
                                    </Button>
                                    <Button onClick={() => setEditingUser(user)} variant="secondary" className="!w-auto !py-1 !px-2 !text-xs">Rol</Button>
                                    <Button onClick={() => setManagingMembershipUser(user)} variant="secondary" className="!w-auto !py-1 !px-2 !text-xs">Membresía</Button>
                                    <Button onClick={() => setUserToDelete(user)} variant="secondary" className="!w-auto !py-1 !px-2 !text-xs !bg-red-100 !text-red-700 hover:!bg-red-200 dark:!bg-red-900/50 dark:!text-red-300">
                                        <TrashIcon className="w-4 h-4"/>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <nav className="flex justify-between items-center" aria-label="Navegación de usuarios">
                    <Button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        variant="secondary"
                        className="!w-auto !py-1 !px-3 !text-sm"
                    >
                        Anterior
                    </Button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        variant="secondary"
                        className="!w-auto !py-1 !px-3 !text-sm"
                    >
                        Siguiente
                    </Button>
                </nav>
            )}
            <EditUserRoleModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveRole} userProfile={editingUser} />
            <ManageMembershipModal isOpen={!!managingMembershipUser} onClose={() => setManagingMembershipUser(null)} onSave={handleSaveMembership} userProfile={managingMembershipUser} />
            <ConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que quieres eliminar al usuario ${userToDelete?.email}? Esta acción es permanente y no se puede deshacer.`}
                confirmText="Eliminar Usuario"
                cancelText="Cancelar"
            />
        </div>
    );
};

const LISTINGS_PER_PAGE = 10;
type ListingStatus = 'pending' | 'verified' | 'rejected';

const ListingsManagement: React.FC<{ listings: Listing[], onListingsUpdate: React.Dispatch<React.SetStateAction<Listing[]>>, loading: boolean }> = ({ listings, onListingsUpdate, loading }) => {
    const [rejectingListing, setRejectingListing] = useState<Listing | null>(null);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [viewingListing, setViewingListing] = useState<Listing | null>(null);
    const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
    const [feedback, setFeedback] = useState<{type: 'success' | 'error', text: string} | null>(null);
    
    const [statusFilter, setStatusFilter] = useState<ListingStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<'createdAt' | 'title'>('createdAt');
    const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);
    
    const showFeedback = (type: 'success' | 'error', text: string) => {
        setFeedback({ type, text });
        setTimeout(() => setFeedback(null), 4000);
    }
    
    // Fix: Cast the updated listing object to the correct type to resolve the discriminated union error.
    const handleUpdateListing = (id: string, data: Partial<Listing>) => {
        onListingsUpdate(prev => prev.map(l => l.id === id ? ({ ...l, ...data } as Listing) : l));
    };

    const handleApprove = async (listingToApprove: Listing) => {
        if (approvingId) return;
    
        setViewingListing(null);
        setApprovingId(listingToApprove.id);
        try {
            const data = { 
                status: 'verified' as const, 
                rejectionDetails: null 
            };
            if(listingToApprove.listingType === 'professional') {
                await updateListing(listingToApprove.id, data);
            } else {
                await updateJobListing(listingToApprove.id, data);
            }
            handleUpdateListing(listingToApprove.id, data);
            showFeedback('success', '¡Publicación aprobada! Ahora es visible para todos los usuarios.');
        } catch(error) {
            console.error("Error approving listing:", error);
            showFeedback('error', 'Error al aprobar la publicación.');
        } finally {
            setApprovingId(null);
        }
    };


    const handleReject = async (feedback: { reasons: string[], details: string }) => {
        if (!rejectingListing) return;
        try {
            const data = { 
                status: 'rejected' as const, 
                rejectionDetails: feedback 
            };
            if(rejectingListing.listingType === 'professional') {
                await updateListing(rejectingListing.id, data);
            } else {
                await updateJobListing(rejectingListing.id, data);
            }
            handleUpdateListing(rejectingListing.id, data);
            showFeedback('success', 'Publicación rechazada.');
            setRejectingListing(null);
        } catch (error) {
            console.error("Error rejecting listing:", error);
            throw error;
        }
    };

    const confirmDelete = async () => {
        if (!listingToDelete) return;
        try {
            if(listingToDelete.listingType === 'professional') {
                await deleteListing(listingToDelete.id);
            } else {
                await deleteJobListing(listingToDelete.id);
            }
            onListingsUpdate(prev => prev.filter(l => l.id !== listingToDelete.id));
            showFeedback('success', 'Publicación eliminada correctamente.');
        } catch (error) {
            console.error("Error deleting listing:", error);
            showFeedback('error', 'Error al eliminar la publicación.');
        } finally {
            setListingToDelete(null);
        }
    };
    
    const handleRejectFromModal = (listingToReject: Listing) => {
        setViewingListing(null);
        setRejectingListing(listingToReject);
    };

    const statusCounts = React.useMemo(() => {
        const counts: Record<ListingStatus, number> = {
            pending: 0,
            verified: 0,
            rejected: 0,
        };
        listings.forEach(listing => {
            counts[listing.status]++;
        });
        return { ...counts, all: listings.length };
    }, [listings]);

    const filterOptions: { value: ListingStatus | 'all', label: string }[] = [
        { value: 'all', label: 'Todas' },
        { value: 'pending', label: 'Pendientes' },
        { value: 'verified', label: 'Verificadas' },
        { value: 'rejected', label: 'Rechazadas' },
    ];

    const filteredAndSortedListings = listings
    .filter(listing => {
        const query = searchQuery.toLowerCase().trim();
        const statusMatch = statusFilter === 'all' || listing.status === statusFilter;
        
        const searchMatch = !query || (listing.listingType === 'professional' ?
            listing.serviceTitle.toLowerCase().includes(query) || listing.professionalName.toLowerCase().includes(query) :
            (listing.jobTitle.toLowerCase().includes(query) || (listing.companyName && listing.companyName.toLowerCase().includes(query)))
        );
            
        return statusMatch && searchMatch;
    })
    .sort((a, b) => {
        if (sortKey === 'createdAt') {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortKey === 'title') {
            const titleA = a.listingType === 'professional' ? a.serviceTitle : a.jobTitle;
            const titleB = b.listingType === 'professional' ? b.serviceTitle : b.jobTitle;
            return sortDirection === 'asc' 
            ? titleA.localeCompare(titleB) 
            : titleB.localeCompare(titleA);
        }
        return 0;
    });
    
    const totalPages = Math.ceil(filteredAndSortedListings.length / LISTINGS_PER_PAGE);
    const paginatedListings = filteredAndSortedListings.slice((currentPage - 1) * LISTINGS_PER_PAGE, currentPage * LISTINGS_PER_PAGE);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Gestionar Publicaciones</h1>

            <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filtrar por estado:</span>
                {filterOptions.map(option => (
                    <button
                        key={option.value}
                        onClick={() => setStatusFilter(option.value)}
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                            statusFilter === option.value
                                ? 'bg-indigo-600 text-white shadow'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <span>{option.label}</span>
                        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                            statusFilter === option.value
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                        }`}>
                            {statusCounts[option.value as keyof typeof statusCounts] ?? 0}
                        </span>
                    </button>
                ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por título, profesional o empresa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-300 transition"
                        aria-label="Buscar publicaciones"
                    />
                </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    <label htmlFor="sort-key" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ordenar por:</label>
                    <select 
                        id="sort-key" 
                        value={sortKey} 
                        onChange={(e) => setSortKey(e.target.value as any)}
                        className="py-2 pl-3 pr-8 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white transition text-sm appearance-none"
                        aria-label="Criterio de ordenación"
                    >
                        <option value="createdAt">Fecha de Creación</option>
                        <option value="title">Título</option>
                    </select>
                    <button 
                        onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        aria-label={`Cambiar a orden ${sortDirection === 'asc' ? 'descendente' : 'ascendente'}`}
                    >
                        {sortDirection === 'asc' ? <SortAscendingIcon /> : <SortDescendingIcon />}
                    </button>
                </div>
            </div>

            {feedback && (
              <div 
                className={`p-3 rounded-lg mb-4 text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                role="alert"
              >
                {feedback.text}
              </div>
            )}
            
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
                </div>
            ) : paginatedListings.length > 0 ? (
                <>
                    <ul className="space-y-4">
                        {paginatedListings.map(listing => {
                            const isJob = listing.listingType === 'job';
                            const title = isJob ? (listing as JobListing).jobTitle : (listing as ProfessionalListing).serviceTitle;
                            const author = isJob ? (listing as JobListing).recommenderName : (listing as ProfessionalListing).professionalName;
                            const imageUrl = isJob ? `https://source.unsplash.com/random/100x100?job&id=${listing.id}` : (listing as ProfessionalListing).imageUrl || `https://source.unsplash.com/random/100x100?service&id=${listing.id}`;

                            return (
                                <li key={listing.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <img src={imageUrl} alt={title} className="w-20 h-20 rounded-md object-cover flex-shrink-0" />
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold py-1 px-2 rounded-md ${isJob ? 'bg-sky-200 text-sky-800' : 'bg-lime-200 text-lime-800'}`}>
                                                {isJob ? 'Empleo' : 'Servicio'}
                                            </span>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Por: {author}</p>
                                        <span className={`mt-2 inline-block px-3 py-1 text-xs font-medium rounded-full ${statusInfo[listing.status]?.color || 'bg-gray-200'}`}>
                                            {statusInfo[listing.status]?.text || 'Desconocido'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center flex-shrink-0">
                                        <Button
                                            onClick={() => setViewingListing(listing)}
                                            variant="secondary"
                                            className="!w-full sm:!w-auto !py-1 !px-3 !text-xs flex items-center gap-1 justify-center"
                                            aria-label={`Ver detalles de "${title}"`}
                                        >
                                            <EyeIcon className="w-4 h-4"/>
                                            <span>Detalles</span>
                                        </Button>
                                        {listing.status === 'pending' && (
                                            <>
                                                <Button
                                                    onClick={() => handleApprove(listing)}
                                                    disabled={approvingId === listing.id}
                                                    className="!w-full sm:!w-auto !py-1 !px-3 !text-xs !bg-green-500 hover:!bg-green-600 text-white flex items-center gap-1 min-w-[80px] justify-center"
                                                    aria-label={`Aprobar la publicación "${title}"`}
                                                >
                                                    {approvingId === listing.id ? 'Aprobando...' : (
                                                        <>
                                                            <CheckCircleIcon className="w-4 h-4"/>
                                                            <span>Aprobar</span>
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={() => setRejectingListing(listing)}
                                                    className="!w-full sm:!w-auto !py-1 !px-3 !text-xs !bg-red-500 hover:!bg-red-600 text-white flex items-center gap-1 min-w-[80px] justify-center"
                                                    aria-label={`Rechazar la publicación "${title}"`}
                                                >
                                                    <XCircleIcon className="w-4 h-4"/>
                                                    <span>Rechazar</span>
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            onClick={() => setListingToDelete(listing)}
                                            variant="secondary"
                                            className="!w-full sm:!w-auto !py-1 !px-3 !text-xs !bg-red-100 !text-red-700 hover:!bg-red-200 dark:!bg-red-900/50 dark:!text-red-300 flex items-center gap-1 justify-center"
                                            aria-label={`Eliminar la publicación "${title}"`}
                                        >
                                            <TrashIcon className="w-4 h-4"/>
                                            <span>Eliminar</span>
                                        </Button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                     {totalPages > 1 && (
                         <nav className="mt-6 flex justify-between items-center" aria-label="Navegación de publicaciones">
                            <Button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                variant="secondary"
                                className="!w-auto !py-1 !px-3 !text-sm"
                                aria-label="Ir a la página anterior de publicaciones"
                            >
                                Anterior
                            </Button>
                            <span className="text-sm text-gray-700 dark:text-gray-300" aria-live="polite" aria-atomic="true">
                                Página {currentPage} de {totalPages}
                            </span>
                            <Button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                variant="secondary"
                                className="!w-auto !py-1 !px-3 !text-sm"
                                aria-label="Ir a la página siguiente de publicaciones"
                            >
                                Siguiente
                            </Button>
                        </nav>
                    )}
                </>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">No se encontraron publicaciones que coincidan con tus filtros.</p>
                </div>
            )}
            
            <RejectionModal isOpen={!!rejectingListing} onClose={() => setRejectingListing(null)} onConfirm={handleReject} />
            <ListingDetailsModal 
                isOpen={!!viewingListing} 
                onClose={() => setViewingListing(null)} 
                listing={viewingListing} 
                onApprove={handleApprove}
                onReject={handleRejectFromModal}
                approvingId={approvingId}
            />
            <ConfirmationModal
                isOpen={!!listingToDelete}
                onClose={() => setListingToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

const AdminDashboard: React.FC<DashboardProps> = ({ user, userProfile, onLogout, onProfileUpdate, initialView }) => {
  const [activeView, setActiveView] = useState<DashboardView>(initialView);
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [nextView, setNextView] = useState<DashboardView | null>(null);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlanDetails[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [reviewingUser, setReviewingUser] = useState<UserProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };
  
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
        const [plans, allUsers, allListings, config] = await Promise.all([
            getMembershipPlans(),
            getAllUsers(),
            getAllListings(),
            getAppConfig()
        ]);
        setMembershipPlans(plans);
        setUsers(allUsers.filter(u => u.uid !== user.uid)); // Exclude self
        setListings(allListings);
        setAppConfig(config);
    } catch (error) {
        console.error("Error fetching admin data:", error);
    } finally {
        setLoadingData(false);
    }
  }, [user.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNavigation = (targetView: DashboardView) => {
    if (activeView === 'profile' && isProfileDirty && targetView !== 'profile') {
      setNextView(targetView);
      setShowConfirmModal(true);
    } else {
      setActiveView(targetView);
    }
  };

  const handleConfirmNavigation = () => {
    if (nextView) {
      setIsProfileDirty(false); 
      setActiveView(nextView);
    }
    setShowConfirmModal(false);
    setNextView(null);
  };
  
  const handleCancelNavigation = () => {
    setShowConfirmModal(false);
    setNextView(null);
  };
  
  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    onProfileUpdate(updatedData);
    setIsProfileDirty(false);
  };

  const handleConfigUpdate = async (data: Partial<AppConfig>) => {
    try {
        await updateAppConfig(data);
        setAppConfig(prev => prev ? { ...prev, ...data } : null);
        showFeedback('success', 'Configuración actualizada correctamente.');
    } catch (error) {
        console.error("Error updating config:", error);
        showFeedback('error', 'No se pudo actualizar la configuración.');
    }
  };

  const handleVerifyPayment = async (uid: string, isApproved: boolean) => {
    const userToUpdate = users.find(u => u.uid === uid);
    if (!userToUpdate || !userToUpdate.membership) return;

    const newExpiryDate = new Date();
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

    const updatedMembership: Membership = {
        ...userToUpdate.membership,
        status: isApproved ? 'active' : 'inactive',
        paymentReceiptUrl: '',
        ...(isApproved && { expiresAt: firebase.firestore.Timestamp.fromDate(newExpiryDate) }),
    };
    
    try {
        await updateUserProfile(uid, { membership: updatedMembership });
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, membership: updatedMembership } : u));
        setReviewingUser(null);
        showFeedback('success', `Verificación ${isApproved ? 'aprobada' : 'rechazada'} para ${userToUpdate.email}.`);
    } catch (error) {
        console.error("Error verifying payment", error);
        showFeedback('error', `Error al procesar la verificación.`);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'profile':
        return <ProfilePage user={user} userProfile={userProfile} onProfileUpdate={handleProfileUpdate} onDirtyChange={setIsProfileDirty} membershipPlans={membershipPlans} userRole={userProfile.role} setActiveView={handleNavigation} />;
      case 'users':
        return <UsersManagement users={users} onUsersUpdate={setUsers} showFeedback={showFeedback} onViewDetails={setViewingUser} />;
      case 'listings':
        return <ListingsManagement listings={listings} onListingsUpdate={setListings} loading={loadingData} />;
      case 'membershipPlans':
        return <MembershipPlanManagement plans={membershipPlans} onPlansUpdate={setMembershipPlans} appConfig={appConfig} onConfigUpdate={handleConfigUpdate} />;
      case 'paymentVerifications':
        return <PaymentVerificationsManagement
            users={users.filter(u => u.membership?.status === 'pending_verification')}
            plans={membershipPlans}
            onReview={setReviewingUser}
        />;
      case 'overview':
      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Resumen de Administrador</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Bienvenido, {userProfile.fullName || user.email}.</p>
            {loadingData ? (
                 <div className="flex items-center justify-center h-48">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{users.length}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Usuarios Registrados</p>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{listings.length}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Publicaciones Totales</p>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{listings.filter(l => l.status === 'pending').length}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Pendientes de Revisión</p>
                    </div>
                </div>
            )}
          </div>
        );
    }
  };

  const pendingVerificationCount = users.filter(u => u.membership?.status === 'pending_verification').length;

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 w-full max-w-7xl mx-auto">
        <DashboardSidebar 
          user={user}
          userProfile={userProfile}
          activeView={activeView}
          setActiveView={handleNavigation}
          onLogout={onLogout}
          pendingVerificationCount={pendingVerificationCount}
        />
        <main className="flex-grow">
          <div className="flex justify-end mb-4">
              <NotificationBell userProfile={userProfile} />
          </div>
          {feedback && (
            <div 
              className={`p-3 rounded-lg mb-4 text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              role="alert"
            >
              {feedback.text}
            </div>
          )}
          {renderContent()}
        </main>
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelNavigation}
        onConfirm={handleConfirmNavigation}
        title="Cambios sin guardar"
        message="Tienes cambios sin guardar. ¿Estás seguro de que quieres salir y descartarlos?"
        confirmText="Descartar Cambios"
        cancelText="Permanecer"
      />
       <PaymentVerificationModal
            isOpen={!!reviewingUser}
            onClose={() => setReviewingUser(null)}
            onVerify={handleVerifyPayment}
            userProfile={reviewingUser}
            planName={membershipPlans.find(p => p.id === reviewingUser?.membership?.planId)?.name || ''}
        />
       <UserDetailsModal
            isOpen={!!viewingUser}
            onClose={() => setViewingUser(null)}
            user={viewingUser}
            plans={membershipPlans}
        />
    </>
  );
};

export default AdminDashboard;
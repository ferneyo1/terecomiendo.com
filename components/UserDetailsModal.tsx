import React from 'react';
import { type UserProfile, type MembershipPlanDetails, UserRole } from '../types';
import CloseIcon from './icons/CloseIcon';
import Avatar from './Avatar';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  plans: MembershipPlanDetails[];
}

const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{children || value || 'N/A'}</dd>
    </div>
);


const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user, plans }) => {
    if (!isOpen || !user) return null;

    const getPlanName = (planId?: string) => plans.find(p => p.id === planId)?.name || 'N/A';
    const plan = user.membership ? getPlanName(user.membership.planId) : 'N/A';
    const membershipStatus = user.membership?.status?.replace('_', ' ') || 'N/A';
    const expiresAt = user.membership?.expiresAt?.toDate().toLocaleDateString() || 'Nunca';

    const renderRoleSpecificDetails = () => {
        if (user.role === UserRole.Recommender) {
            return (
                <>
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mt-6 mb-4 border-t pt-4 border-gray-200 dark:border-gray-700">Info de Recomendador</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                        <DetailItem label="Inicio de Prueba" value={user.trialStartedAt?.toDate().toLocaleDateString()} />
                        <DetailItem label="Publicaciones Hechas" value={user.postsMade || 0} />
                        <DetailItem label="Puntuación Total" value={user.totalRatingPoints || 0} />
                        <DetailItem label="Votos Recibidos" value={user.ratingCount || 0} />
                    </dl>
                </>
            );
        }
        if (user.role === UserRole.Professional) {
            return (
                <>
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mt-6 mb-4 border-t pt-4 border-gray-200 dark:border-gray-700">Info de Profesional</h3>
                     <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                        <DetailItem label="Inicio de Prueba" value={user.listingTrialStartedAt?.toDate().toLocaleDateString()} />
                        <DetailItem label="Publicaciones Hechas" value={user.listingsMade || 0} />
                        <DetailItem label="Verificado">
                           {user.isVerified ? 
                                <span className="flex items-center text-green-600 dark:text-green-400"><CheckCircleIcon className="w-5 h-5 mr-1"/> Sí</span> : 
                                <span className="flex items-center text-red-600 dark:text-red-400"><XCircleIcon className="w-5 h-5 mr-1"/> No</span>}
                        </DetailItem>
                    </dl>
                </>
            );
        }
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-details-title"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <Avatar avatarUrl={user.avatarUrl} size={64} />
                            <div>
                                <h2 id="user-details-title" className="text-xl font-bold text-gray-900 dark:text-white">{user.fullName || 'Usuario sin nombre'}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                                    {user.role}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
                            aria-label="Cerrar modal"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 pt-6">
                            <DetailItem label="Estado de la Cuenta">
                                {user.isActive ?? true ? (
                                    <span className="flex items-center text-green-600 dark:text-green-400"><CheckCircleIcon className="w-5 h-5 mr-1"/> Activo</span>
                                ) : (
                                    <span className="flex items-center text-red-600 dark:text-red-400"><XCircleIcon className="w-5 h-5 mr-1"/> Inactivo</span>
                                )}
                            </DetailItem>
                            <DetailItem label="Teléfono" value={user.phoneNumber} />
                            <DetailItem label="Dirección" value={user.address} />
                            <DetailItem label="Código Postal" value={user.postalCode} />
                        </dl>
                    </div>

                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mt-6 mb-4">Membresía</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6">
                             <DetailItem label="Plan Actual" value={plan} />
                             <DetailItem label="Estado" value={membershipStatus} />
                             <DetailItem label="Vence el" value={expiresAt} />
                        </dl>
                    </div>
                    
                    {renderRoleSpecificDetails()}
                    
                    <div className="mt-8 flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;

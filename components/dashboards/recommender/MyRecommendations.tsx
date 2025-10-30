import React, { useState, useEffect, useCallback } from 'react';
import { type User, getJobListingsByRecommender, updateUserProfile, deleteJobListing } from '../../../services/firebase';
import { type UserProfile, type JobListing } from '../../../types';
import Button from '../../Button';
import CreateJobListingModal from './CreateJobListingModal';
import EditJobListingModal from './EditJobListingModal';
import ConfirmationModal from '../../ConfirmationModal';
import PencilIcon from '../../icons/PencilIcon';
import TrashIcon from '../../icons/TrashIcon';

interface MyRecommendationsProps {
  user: User;
  userProfile: UserProfile;
  onProfileUpdate: (updatedData: Partial<UserProfile>) => void;
}

const statusInfo: Record<string, { text: string, color: string }> = {
  pending: { text: 'Pendiente', color: 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200' },
  verified: { text: 'Verificado', color: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' },
  rejected: { text: 'Rechazado', color: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' },
};

const MyRecommendations: React.FC<MyRecommendationsProps> = ({ user, userProfile, onProfileUpdate }) => {
    const [listings, setListings] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [listingToEdit, setListingToEdit] = useState<JobListing | null>(null);
    const [listingToDelete, setListingToDelete] = useState<JobListing | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const userListings = await getJobListingsByRecommender(user.uid);
            setListings(userListings);
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setLoading(false);
        }
    }, [user.uid]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);
    
    const showFeedback = (message: string) => {
        setFeedbackMessage(message);
        setTimeout(() => setFeedbackMessage(null), 5000);
    }

    const handleListingCreated = () => {
        fetchListings();
        const newCount = (userProfile.postsMade || 0) + 1;
        const updatedProfile = { postsMade: newCount };
        updateUserProfile(user.uid, updatedProfile);
        onProfileUpdate(updatedProfile);
        showFeedback('¡Recomendación creada! Está pendiente de revisión por un administrador.');
    };
    
    const handleListingUpdated = () => {
        fetchListings();
        showFeedback('¡Recomendación actualizada! Está pendiente de revisión.');
        setIsEditModalOpen(false);
        setListingToEdit(null);
    };

    const openEditModal = (listing: JobListing) => {
        setListingToEdit(listing);
        setIsEditModalOpen(true);
    };

    const openDeleteConfirm = (listing: JobListing) => {
        setListingToDelete(listing);
    };

    const confirmDelete = async () => {
        if (!listingToDelete) return;
        try {
            await deleteJobListing(listingToDelete.id);
            setListings(prev => prev.filter(l => l.id !== listingToDelete.id));
            showFeedback('Recomendación eliminada correctamente.');
        } catch (error) {
            console.error("Error deleting listing:", error);
            showFeedback('Error al eliminar la recomendación.');
        } finally {
            setListingToDelete(null);
        }
    };


    const canPost = () => {
        const isPaidActive = userProfile.membership?.status === 'active' && userProfile.membership.expiresAt;
        if (isPaidActive) return true;

        const trialStart = userProfile.trialStartedAt?.toDate();
        if (!trialStart) return false;

        const now = new Date();
        const trialEndDate = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        const isTrialActive = now < trialEndDate;
        const postsMade = userProfile.postsMade || 0;

        return isTrialActive && postsMade < 5;
    };

    const showUpgradeMessage = !canPost() && listings.length > 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Mis Recomendaciones</h1>
                    <p className="text-gray-600 dark:text-gray-400">Gestiona las ofertas de empleo que recomiendas.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} disabled={!canPost()}>
                    Recomendar Empleo
                </Button>
            </div>
            
            {feedbackMessage && (
                <div className="p-4 rounded-lg mb-6 text-center bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 transition-opacity duration-500">
                    <p>{feedbackMessage}</p>
                </div>
            )}

            {showUpgradeMessage && (
                <div className="p-4 rounded-lg mb-6 text-center bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                    <p>Has alcanzado tu límite de publicaciones de prueba. Para seguir recomendando, por favor, <span className="font-bold">mejora tu membresía</span>.</p>
                </div>
            )}

            {loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Cargando recomendaciones...</p>
            ) : listings.length > 0 ? (
                <div className="space-y-4">
                    {listings.map(listing => (
                        <div key={listing.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex-grow">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{listing.jobTitle} - <span className="font-normal text-gray-600 dark:text-gray-300">{listing.companyName}</span></h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{listing.address}</p>
                                <span className={`mt-2 inline-block px-3 py-1 text-xs font-medium rounded-full ${statusInfo[listing.status]?.color || 'bg-gray-200'}`}>
                                    {statusInfo[listing.status]?.text || 'Desconocido'}
                                </span>
                            </div>
                            <div className="flex gap-2 self-start sm:self-center">
                                <Button onClick={() => openEditModal(listing)} variant="secondary" className="!w-auto !p-2">
                                    <PencilIcon />
                                </Button>
                                <Button onClick={() => openDeleteConfirm(listing)} variant="secondary" className="!w-auto !p-2 !bg-red-100 !text-red-700 hover:!bg-red-200 dark:!bg-red-900/50 dark:!text-red-300">
                                    <TrashIcon />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Aún no has recomendado ninguna oferta de empleo.</p>
                </div>
            )}

            {isCreateModalOpen && (
                <CreateJobListingModal
                    onClose={() => setIsCreateModalOpen(false)}
                    user={user}
                    userProfile={userProfile}
                    onListingCreated={handleListingCreated}
                />
            )}
            
            {isEditModalOpen && listingToEdit && (
                <EditJobListingModal
                    onClose={() => setIsEditModalOpen(false)}
                    listing={listingToEdit}
                    onListingUpdated={handleListingUpdated}
                />
            )}
            
            <ConfirmationModal
                isOpen={!!listingToDelete}
                onClose={() => setListingToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que quieres eliminar la oferta de "${listingToDelete?.jobTitle}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
            />

        </div>
    );
};

export default MyRecommendations;

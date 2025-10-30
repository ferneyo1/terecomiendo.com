import React, { useState, useEffect, useCallback } from 'react';
import { type User, getListingsByProfessional, updateUserProfile, deleteListing } from '../../../services/firebase';
import { type UserProfile, type ProfessionalListing } from '../../../types';
import Button from '../../Button';
import CreateListingModal from './CreateListingModal';
import EditListingModal from './EditListingModal';
import ConfirmationModal from '../../ConfirmationModal';
import PencilIcon from '../../icons/PencilIcon';
import TrashIcon from '../../icons/TrashIcon';

interface MyListingsProps {
  user: User;
  userProfile: UserProfile;
  onProfileUpdate: (updatedData: Partial<UserProfile>) => void;
}

const statusInfo: Record<string, { text: string, color: string }> = {
  pending: { text: 'Pendiente', color: 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200' },
  verified: { text: 'Verificado', color: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' },
  rejected: { text: 'Rechazado', color: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' },
};

const MyListings: React.FC<MyListingsProps> = ({ user, userProfile, onProfileUpdate }) => {
    const [listings, setListings] = useState<ProfessionalListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [listingToEdit, setListingToEdit] = useState<ProfessionalListing | null>(null);
    const [listingToDelete, setListingToDelete] = useState<ProfessionalListing | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const userListings = await getListingsByProfessional(user.uid);
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
        fetchListings(); // Refetch to get the new listing with its ID and status
        const newCount = (userProfile.listingsMade || 0) + 1;
        const updatedProfile = { listingsMade: newCount };
        updateUserProfile(user.uid, updatedProfile);
        onProfileUpdate(updatedProfile);
        showFeedback('¡Publicación creada! Está pendiente de revisión por un administrador.');
    };
    
    const handleListingUpdated = () => {
        fetchListings();
        showFeedback('¡Publicación actualizada! Está pendiente de revisión.');
        setIsEditModalOpen(false);
        setListingToEdit(null);
    };

    const openEditModal = (listing: ProfessionalListing) => {
        setListingToEdit(listing);
        setIsEditModalOpen(true);
    };

    const openDeleteConfirm = (listing: ProfessionalListing) => {
        setListingToDelete(listing);
    };

    const confirmDelete = async () => {
        if (!listingToDelete) return;
        try {
            await deleteListing(listingToDelete.id);
            setListings(prev => prev.filter(l => l.id !== listingToDelete.id));
            showFeedback('Publicación eliminada correctamente.');
        } catch (error) {
            console.error("Error deleting listing:", error);
            showFeedback('Error al eliminar la publicación.');
        } finally {
            setListingToDelete(null);
        }
    };


    const canPost = () => {
        const isPaidActive = userProfile.membership?.status === 'active' && userProfile.membership.expiresAt;
        if (isPaidActive) return true;

        const trialStart = userProfile.listingTrialStartedAt?.toDate();
        if (!trialStart) return false;

        const now = new Date();
        const trialEndDate = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        const isTrialActive = now < trialEndDate;
        const listingsMade = userProfile.listingsMade || 0;

        return isTrialActive && listingsMade < 1;
    };

    const showUpgradeMessage = !canPost() && listings.length > 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Mis Publicaciones</h1>
                    <p className="text-gray-600 dark:text-gray-400">Gestiona los servicios que ofreces a la comunidad.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} disabled={!canPost()}>
                    Crear Nueva Publicación
                </Button>
            </div>
            
            {feedbackMessage && (
                <div className="p-4 rounded-lg mb-6 text-center bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 transition-opacity duration-500">
                    <p>{feedbackMessage}</p>
                </div>
            )}

            {showUpgradeMessage && (
                <div className="p-4 rounded-lg mb-6 text-center bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                    <p>Has alcanzado tu límite de publicaciones. Para añadir más servicios, por favor, <span className="font-bold">mejora tu membresía</span>.</p>
                </div>
            )}

            {loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Cargando publicaciones...</p>
            ) : listings.length > 0 ? (
                <div className="space-y-4">
                    {listings.map(listing => (
                        <div key={listing.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <img src={listing.imageUrl || `https://source.unsplash.com/random/100x100?service&id=${listing.id}`} alt={listing.serviceTitle} className="w-20 h-20 rounded-md object-cover flex-shrink-0" />
                            <div className="flex-grow">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{listing.serviceTitle}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">${listing.price} / {listing.priceType === 'per_hour' ? 'hora' : 'trabajo'}</p>
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
                    <p className="text-gray-500 dark:text-gray-400">Aún no has creado ninguna publicación.</p>
                </div>
            )}

            {isCreateModalOpen && (
                <CreateListingModal
                    onClose={() => setIsCreateModalOpen(false)}
                    user={user}
                    userProfile={userProfile}
                    onListingCreated={handleListingCreated}
                />
            )}
            
            {isEditModalOpen && listingToEdit && (
                <EditListingModal
                    onClose={() => setIsEditModalOpen(false)}
                    user={user}
                    listing={listingToEdit}
                    onListingUpdated={handleListingUpdated}
                />
            )}
            
            <ConfirmationModal
                isOpen={!!listingToDelete}
                onClose={() => setListingToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que quieres eliminar la publicación "${listingToDelete?.serviceTitle}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
            />

        </div>
    );
};

export default MyListings;
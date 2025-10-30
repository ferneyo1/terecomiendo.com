import React, { useState, useRef } from 'react';
import { type User, createListing, uploadListingImage } from '../../../services/firebase';
import { type UserProfile, type ProfessionalListing } from '../../../types';
import Button from '../../Button';
import CloseIcon from '../../icons/CloseIcon';
import CameraIcon from '../../icons/CameraIcon';

interface CreateListingModalProps {
  onClose: () => void;
  user: User;
  userProfile: UserProfile;
  onListingCreated: () => void;
}

const CreateListingModal: React.FC<CreateListingModalProps> = ({ onClose, user, userProfile, onListingCreated }) => {
    const [serviceTitle, setServiceTitle] = useState('');
    const [serviceDetails, setServiceDetails] = useState('');
    const [price, setPrice] = useState('');
    const [priceType, setPriceType] = useState<'per_hour' | 'per_job'>('per_job');
    const [availability, setAvailability] = useState('');
    const [address, setAddress] = useState(userProfile.address || '');
    const [phoneNumber, setPhoneNumber] = useState(userProfile.phoneNumber || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if(file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('La imagen es muy grande. Máximo 5MB.');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serviceTitle || !serviceDetails || !price || !availability || !address || !phoneNumber) {
            setError('Por favor, completa todos los campos obligatorios.');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            let imageUrl: string | undefined = undefined;
            if (imageFile) {
                setUploadProgress(0);
                imageUrl = await uploadListingImage(user.uid, imageFile, setUploadProgress);
            }

            // This is dummy data for now, replace with real logic later
            const solicitedJobs = Math.floor(Math.random() * 20) + 10; // 10 to 30
            const dummyData = {
                rating: Math.random() * 2 + 3, // 3.0 to 5.0
                totalRatings: Math.floor(Math.random() * 50) + 5, // 5 to 55
                solicitedJobs,
                successfulJobs: Math.floor(solicitedJobs * (Math.random() * 0.2 + 0.8)), // 80-100% success rate
            };

            const newListingData: Omit<ProfessionalListing, 'id' | 'createdAt' | 'status'> = {
                // Fix: Add missing 'listingType' property to satisfy the type definition.
                listingType: 'professional',
                professionalId: user.uid,
                serviceTitle,
                serviceDetails,
                price: parseFloat(price),
                priceType,
                availability,
                address,
                phoneNumber,
                professionalName: userProfile.fullName || userProfile.email.split('@')[0],
                isProfessionalVerified: userProfile.isVerified || false,
                ...dummyData,
                ...(imageUrl && { imageUrl }),
                ...(userProfile.avatarUrl && { professionalAvatarUrl: userProfile.avatarUrl }),
            };
            
            await createListing(newListingData);
            
            onListingCreated();
            onClose();

        } catch (err) {
            setError('No se pudo crear la publicación. Inténtalo de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
            setUploadProgress(null);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-listing-title"
            >
                <div className="relative p-6 sm:p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
                        aria-label="Cerrar modal"
                    >
                        <CloseIcon />
                    </button>
                    <h2 id="create-listing-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Crear Nueva Publicación</h2>
                    
                     <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        {error && <p className="text-sm text-center text-red-700 bg-red-100 p-3 rounded-lg">{error}</p>}
                        
                        <div className="relative p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />
                            {imagePreview ? (
                                <img src={imagePreview} alt="Vista previa" className="w-full h-40 object-contain rounded-md mb-2" />
                            ) : (
                                <div className="text-gray-500 dark:text-gray-400 p-4">
                                    <CameraIcon />
                                    <p>Sube una imagen (opcional)</p>
                                </div>
                            )}
                             {uploadProgress !== null && (
                                <div className="absolute inset-0 bg-black bg-opacity-75 rounded-md flex items-center justify-center p-4">
                                    <div className="w-full">
                                        <p className="text-white text-sm font-semibold text-center mb-2">{`Subiendo... ${Math.round(uploadProgress || 0)}%`}</p>
                                        <div className="w-full bg-gray-600 rounded-full h-2.5">
                                            <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%`, transition: 'width 0.3s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <Button type="button" onClick={() => fileInputRef.current?.click()} variant="secondary" className="!w-auto !py-1 !px-3 !text-sm mt-2" disabled={loading}>
                                {imagePreview ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                            </Button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Servicio que prestas</label>
                            <input type="text" value={serviceTitle} onChange={e => setServiceTitle(e.target.value)} required className="w-full mt-1 input-style" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Detalles del servicio</label>
                            <textarea value={serviceDetails} onChange={e => setServiceDetails(e.target.value)} required rows={4} className="w-full mt-1 input-style"></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Valor</label>
                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="w-full mt-1 input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Tipo de cobro</label>
                                <select value={priceType} onChange={e => setPriceType(e.target.value as any)} className="w-full mt-1 input-style">
                                    <option value="per_job">Por trabajo</option>
                                    <option value="per_hour">Por hora</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Horario disponible</label>
                            <input type="text" value={availability} onChange={e => setAvailability(e.target.value)} required className="w-full mt-1 input-style" placeholder="Ej: Lunes a Viernes, 9am - 5pm" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Dirección</label>
                                <input type="text" value={address} onChange={e => setAddress(e.target.value)} required className="w-full mt-1 input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Teléfono de contacto</label>
                                <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="w-full mt-1 input-style" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 gap-3">
                           <Button type="button" onClick={onClose} variant="secondary">
                             Cancelar
                           </Button>
                           <Button type="submit" disabled={loading}>
                             {loading ? 'Publicando...' : 'Crear Publicación'}
                           </Button>
                        </div>
                    </form>
                </div>
            </div>
             <style>{`
                .input-style {
                    background-color: #f3f4f6;
                    border: 2px solid transparent;
                    border-radius: 0.5rem;
                    padding: 0.75rem 1rem;
                    transition: all 0.2s;
                }
                .dark .input-style {
                    background-color: #374151;
                }
                .input-style:focus {
                    border-color: #6366f1;
                    outline: none;
                    --tw-ring-shadow: none;
                }
             `}</style>
        </div>
    );
};

export default CreateListingModal;
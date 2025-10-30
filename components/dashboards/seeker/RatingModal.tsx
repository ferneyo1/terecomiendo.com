import React, { useState } from 'react';
import { type User, submitRating } from '../../../services/firebase';
import { type JobListing } from '../../../types';
import Button from '../../Button';
import CloseIcon from '../../icons/CloseIcon';
import StarIcon from '../../icons/StarIcon';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobListing: JobListing;
  user: User;
  onRatingSuccess: (jobId: string) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, jobListing, user, onRatingSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Por favor, selecciona una calificación.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await submitRating(jobListing.id, user.uid, jobListing.recommenderId, rating);
            onRatingSuccess(jobListing.id);
        } catch (err) {
            setError('No se pudo enviar la calificación. Inténtalo de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
                role="dialog"
                aria-modal="true"
                aria-labelledby="rating-modal-title"
            >
                <div className="relative p-6 sm:p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <CloseIcon />
                    </button>
                    <h2 id="rating-modal-title" className="text-xl font-bold text-center text-gray-900 dark:text-white">
                        Calificar a {jobListing.recommenderName}
                    </h2>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
                        Tu calificación es por la recomendación del empleo: "{jobListing.jobTitle}"
                    </p>
                    
                    <div className="flex justify-center items-center space-x-2 my-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                aria-label={`Calificar con ${star} estrella${star > 1 ? 's' : ''}`}
                            >
                                <StarIcon
                                    className={`w-10 h-10 cursor-pointer transition-colors ${
                                        (hoverRating || rating) >= star ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>

                    {error && <p className="text-sm text-center text-red-500 mb-4">{error}</p>}
                    
                    <div className="flex flex-col sm:flex-row-reverse gap-3">
                        <Button onClick={handleSubmit} disabled={loading || rating === 0}>
                            {loading ? 'Enviando...' : 'Enviar Calificación'}
                        </Button>
                         <Button onClick={onClose} variant="secondary">
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
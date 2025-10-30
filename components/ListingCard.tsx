import React, { useState } from 'react';
import { type Listing, type JobListing, type ProfessionalListing } from '../types';
import { type User } from '../services/firebase';
import Button from './Button';
import Avatar from './Avatar';
import StarIcon from './icons/StarIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import HeartIcon from './icons/HeartIcon';
import LocationIcon from './icons/LocationIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';

interface ListingCardProps {
  listing: Listing;
  onViewDetails: () => void;
  user?: User | null;
  onLoginRequest?: (jobId?: string) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onViewDetails }) => {
    const [isFavorite, setIsFavorite] = useState(false);

    const isJob = listing.listingType === 'job';
    const job = isJob ? (listing as JobListing) : null;
    const prof = !isJob ? (listing as ProfessionalListing) : null;

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <StarIcon
                    key={i}
                    className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                />
            );
        }
        return stars;
    };
    
    const salaryText = job?.salary 
        ? `$${job.salary.value.toLocaleString()}/${job.salary.type === 'per_hour' ? 'hr' : 'año'}` 
        : 'Salario a convenir';

    const defaultJobImageUrl = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=400&h=300&fit=crop';
    const imageUrl = isJob
        ? defaultJobImageUrl
        : prof?.imageUrl || `https://source.unsplash.com/random/400x300?service,work&q=${prof?.serviceTitle}`;
    

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            {isJob && job ? (
                <>
                    <div className="relative">
                        <img
                            className="h-56 w-full object-cover"
                            src={imageUrl}
                            alt={job.jobTitle}
                        />
                         {/* Verificado Badge (Top Left) */}
                        {listing.status === 'verified' && (
                            <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                                Verificado
                            </div>
                        )}

                        {/* Heart Icon (Top Right) */}
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFavorite(!isFavorite);
                                }}
                                className={`p-2.5 rounded-full bg-gray-900/30 backdrop-blur-sm transition-colors duration-200 ${
                                    isFavorite ? 'text-red-500' : 'text-white hover:text-red-500 dark:hover:text-red-400'
                                }`}
                                aria-label={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
                            >
                                <HeartIcon filled={isFavorite} />
                            </button>
                        </div>
                        
                        {/* Central Overlapping Icon */}
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2">
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-full shadow-lg border-4 border-white dark:border-gray-800">
                                <BriefcaseIcon className="w-8 h-8 text-indigo-600" />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow pt-10">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">EMPLEO</span>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate" title={job.jobTitle}>
                                {job.jobTitle}
                            </h3>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2.5rem]">
                            {job.jobDetails}
                        </div>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{salaryText}</p>
                        
                        <div className="mt-4 flex-grow">
                            <div className="flex justify-between items-center text-xs mb-1">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Postulaciones</span>
                                <span className="text-gray-500 dark:text-gray-400">{job.applicantCount} / 20</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${(job.applicantCount / 20) * 100}%` }}
                                    role="progressbar"
                                    aria-valuenow={job.applicantCount}
                                    aria-valuemin={0}
                                    aria-valuemax={20}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center">
                                <Avatar avatarUrl={job.recommenderAvatarUrl} size={40} />
                                <div className="ml-3">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{job.recommenderName}</p>
                                    {typeof job.recommenderRating === 'number' && (
                                        <div className="flex items-center mt-0.5">
                                            {renderStars(job.recommenderRating)}
                                            <span className="ml-1.5 text-xs font-bold text-gray-600 dark:text-gray-300">{job.recommenderRating.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button onClick={onViewDetails} className="!w-auto !px-5 !py-2.5 !text-sm">Postular</Button>
                        </div>
                    </div>
                </>
            ) : prof ? (
                 <>
                    <div className="relative cursor-pointer" onClick={onViewDetails}>
                        <img
                            className="h-52 w-full object-cover"
                            src={imageUrl}
                            alt={prof.serviceTitle || 'Imagen de la publicación'}
                        />
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 via-black/0 to-black/0"></div>
                        
                        {(prof.rating >= 4.5 || prof.solicitedJobs > 25) && (
                            <div className="absolute top-3 left-3 flex items-center bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                <StarIcon className="w-4 h-4 mr-1.5" />
                                Destacado
                            </div>
                        )}

                        <div className="absolute top-3 right-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFavorite(!isFavorite);
                                }}
                                className={`p-2 rounded-full bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm transition-colors duration-200 drop-shadow-sm ${
                                    isFavorite ? 'text-red-500' : 'text-white hover:text-red-500 dark:hover:text-red-400'
                                }`}
                                aria-label={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
                            >
                                <HeartIcon filled={isFavorite} />
                            </button>
                        </div>
                         {listing.status === 'verified' && (
                            <div className="absolute bottom-3 left-3 flex items-center bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                                Publicación Verificada
                            </div>
                         )}
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                        <div className="flex items-center mb-3">
                            <Avatar avatarUrl={prof.professionalAvatarUrl} size={40} />
                            <div className="ml-3">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{prof.professionalName}</p>
                                {prof.isProfessionalVerified && (
                                    <div className="flex items-center text-xs text-teal-600 dark:text-teal-400 font-medium">
                                        <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                                        <span>Profesional Verificado</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <h3 onClick={onViewDetails} className="cursor-pointer text-lg font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate" title={prof.serviceTitle}>
                            {prof.serviceTitle}
                        </h3>
                        <div className="flex items-center my-2">
                            {renderStars(prof.rating)}
                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                                {prof.rating.toFixed(1)}
                                <span className="ml-1">({prof.totalRatings} reseñas)</span>
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow mt-1 line-clamp-2" title={prof.serviceDetails || ''}>
                            {prof.serviceDetails}
                        </p>
                        <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                             <div>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">${prof.price}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">/{prof.priceType === 'per_hour' ? 'hora' : 'trabajo'}</span>
                            </div>
                            <Button onClick={onViewDetails} variant="secondary" className="!w-auto !px-4 !py-2 !text-sm">
                                Ver Detalles
                            </Button>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default ListingCard;
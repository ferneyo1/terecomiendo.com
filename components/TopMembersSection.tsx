import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/firebase';
import { UserRole, type UserProfile } from '../types';
import Avatar from './Avatar';
import StarIcon from './icons/StarIcon';

interface TopRecommender extends UserProfile {
    averageRating: number;
}

const TopMembersSection: React.FC = () => {
    const [topRecommenders, setTopRecommenders] = useState<TopRecommender[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopRecommenders = async () => {
            try {
                const allUsers = await getAllUsers();
                const recommenders = allUsers
                    .filter(user => user.role === UserRole.Recommender)
                    .map(user => ({
                        ...user,
                        averageRating: (user.ratingCount && user.ratingCount > 0) 
                            ? (user.totalRatingPoints || 0) / user.ratingCount 
                            : 0,
                    }))
                    .sort((a, b) => {
                        if (b.averageRating !== a.averageRating) {
                            return b.averageRating - a.averageRating;
                        }
                        return (b.ratingCount || 0) - (a.ratingCount || 0);
                    })
                    .slice(0, 3);
                
                setTopRecommenders(recommenders);
            } catch (error) {
                console.error("Error fetching top recommenders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopRecommenders();
    }, []);

    const renderStars = (rating: number) => {
        const totalStars = 5;
        const roundedRating = Math.round(rating);
        const stars = [];
        for (let i = 1; i <= totalStars; i++) {
            stars.push(
                <StarIcon 
                    key={i} 
                    className={`w-5 h-5 ${i <= roundedRating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} 
                />
            );
        }
        return stars;
    };

    if (loading) {
        return (
            <section className="bg-gray-100 dark:bg-gray-900 py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="w-12 h-12 mx-auto border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
                </div>
            </section>
        );
    }

    if (topRecommenders.length === 0) {
        return null; // Don't render the section if there are no recommenders
    }

    return (
        <section className="bg-gray-100 dark:bg-gray-900 py-16 sm:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Top Recomendadores
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Conoce a los miembros más confiables y activos de nuestra comunidad.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                    {topRecommenders.map((recommender, index) => {
                        const rating = recommender.averageRating || 0;
                        const ratingCount = recommender.ratingCount || 0;
                        
                        return (
                            <div 
                                key={recommender.uid} 
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center space-x-6 transform transition-transform hover:-translate-y-2"
                            >
                                <span className="text-4xl font-bold text-gray-300 dark:text-gray-600">{index + 1}.</span>
                                <Avatar avatarUrl={recommender.avatarUrl} size={80} />
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={recommender.fullName || 'Usuario Anónimo'}>
                                        {recommender.fullName || 'Usuario Anónimo'}
                                    </h3>
                                    <div className="flex items-center flex-wrap mt-1">
                                        <div className="flex items-center">
                                            {renderStars(rating)}
                                        </div>
                                        <span className="ml-2 font-bold text-gray-700 dark:text-gray-300">{rating.toFixed(1)}</span>
                                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({ratingCount} reseñas)</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default TopMembersSection;

import React, { useState, useEffect } from 'react';
import { getMembershipPlans } from '../services/firebase';
import { type MembershipPlanDetails } from '../types';
import Button from './Button';
import TagIcon from './icons/TagIcon';
import DollarSignIcon from './icons/DollarSignIcon';
import StarIcon from './icons/StarIcon';

interface MembershipSectionProps {
  onRegisterClick: () => void;
}

const planColors: Record<string, { bg: string, text: string, button: string, ring: string, popularTagBg: string }> = {
    seeker: {
        bg: 'bg-white dark:bg-gray-800',
        text: 'text-slate-500 dark:text-slate-400',
        button: '!bg-slate-500 hover:!bg-slate-600 focus:!ring-slate-500',
        ring: 'ring-gray-200 dark:ring-gray-700',
        popularTagBg: '',
    },
    recommender: {
        bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-blue-900/30',
        text: 'text-blue-500 dark:text-blue-400',
        button: '!bg-blue-500 hover:!bg-blue-600 focus:!ring-blue-500',
        ring: 'ring-blue-200 dark:ring-blue-600',
        popularTagBg: 'bg-blue-500'
    },
    professional: {
        bg: 'bg-white dark:bg-gray-800',
        text: 'text-sky-400 dark:text-sky-300',
        button: '!bg-sky-400 hover:!bg-sky-500 focus:!ring-sky-400',
        ring: 'ring-gray-200 dark:ring-gray-700',
        popularTagBg: '',
    },
}


const MembershipSection: React.FC<MembershipSectionProps> = ({ onRegisterClick }) => {
    const [plans, setPlans] = useState<MembershipPlanDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const fetchedPlans = await getMembershipPlans();
                setPlans(fetchedPlans);
            } catch (error) {
                console.error("Error fetching membership plans:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    return (
        <section className="bg-gray-100 dark:bg-gray-900 py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Planes a tu Medida
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Elige el plan que mejor se adapta a tus necesidades y únete a una comunidad de confianza.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center">Cargando planes...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                        {plans.map(plan => {
                            const isPopular = plan.id === 'recommender';
                            const colors = planColors[plan.id] || planColors.seeker;

                            return (
                                <div 
                                    key={plan.id} 
                                    className={`relative rounded-2xl p-8 ring-1 flex flex-col transition-transform duration-300 transform hover:-translate-y-2 ${colors.bg} ${colors.ring} ${isPopular ? 'scale-105 lg:scale-110 z-10' : ''}`}
                                >
                                    {isPopular && (
                                        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                            <div className={`flex items-center justify-center px-4 py-1 ${colors.popularTagBg} text-white rounded-full text-sm font-semibold`}>
                                                <StarIcon className="w-4 h-4 mr-2" />
                                                Más Popular
                                            </div>
                                        </div>
                                    )}
                                    
                                    <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>{plan.name}</h3>
                                    <p className='mt-4 flex-grow text-gray-600 dark:text-gray-400'>{plan.description}</p>
                                    
                                    <div className="mt-8">
                                        <p className="text-5xl font-bold flex items-center">
                                           <span className='text-gray-900 dark:text-white'>${plan.price}</span>
                                           {plan.price > 0 && <span className='text-lg font-medium ml-2 text-gray-500 dark:text-gray-400'>/ mes</span>}
                                        </p>
                                    </div>

                                    <ul className="mt-8 space-y-4 flex-grow">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <TagIcon className={`w-6 h-6 ${colors.text}`} />
                                                </div>
                                                <p className='ml-3 text-left text-gray-700 dark:text-gray-300'>{feature}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <div className="mt-10">
                                        <Button onClick={onRegisterClick} className={`w-full ${colors.button}`}>
                                            Únete ahora
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default MembershipSection;
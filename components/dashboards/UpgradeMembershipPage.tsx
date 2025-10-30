import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { getMembershipPlans, updateUserProfile, type User } from '../../services/firebase';
import { type MembershipPlanDetails, type UserProfile, type Membership } from '../../types';
import Button from '../Button';
import TagIcon from '../icons/TagIcon';
import StarIcon from '../icons/StarIcon';
import PaymentModal from '../PaymentModal';

interface UpgradeMembershipPageProps {
  user: User;
  userProfile: UserProfile;
  onProfileUpdate: (updatedData: Partial<UserProfile>) => void;
}

const planColors: Record<string, { bg: string, text: string, button: string, ring: string }> = {
    seeker: {
        bg: 'bg-white dark:bg-gray-800',
        text: 'text-slate-500 dark:text-slate-400',
        button: '!bg-slate-600 hover:!bg-slate-700 focus:!ring-slate-500',
        ring: 'ring-gray-200 dark:ring-gray-700',
    },
    recommender: {
        bg: 'bg-white dark:bg-gray-800',
        text: 'text-blue-600 dark:text-blue-400',
        button: '!bg-blue-600 hover:!bg-blue-700 focus:!ring-blue-500',
        ring: 'ring-gray-200 dark:ring-gray-700',
    },
    professional: {
        bg: 'bg-white dark:bg-gray-800',
        text: 'text-sky-600 dark:text-sky-400',
        button: '!bg-sky-600 hover:!bg-sky-700 focus:!ring-sky-500',
        ring: 'ring-gray-200 dark:ring-gray-700',
    },
}

const UpgradeMembershipPage: React.FC<UpgradeMembershipPageProps> = ({ user, userProfile, onProfileUpdate }) => {
    const [plans, setPlans] = useState<MembershipPlanDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<MembershipPlanDetails | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

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

    const handleFreePlanSwitch = async (plan: MembershipPlanDetails) => {
        setIsProcessing(true);
        setFeedbackMessage(null);
        const newMembership: Membership = {
            planId: plan.id,
            status: 'active',
            expiresAt: null, // Free plans don't expire
        };
        try {
            await updateUserProfile(user.uid, { membership: newMembership });
            onProfileUpdate({ membership: newMembership });
            setFeedbackMessage({ type: 'success', text: `Has cambiado al ${plan.name}.` });
        } catch (error) {
            setFeedbackMessage({ type: 'error', text: 'Hubo un error al cambiar tu membresía.' });
            console.error(error);
        } finally {
            setIsProcessing(false);
            setSelectedPlan(null);
        }
    };
    
    const handleSelectPlan = (plan: MembershipPlanDetails) => {
        if (plan.id === userProfile.membership?.planId) return;
        
        setSelectedPlan(plan);

        if (plan.price > 0) {
            setShowPaymentModal(true);
        } else {
            handleFreePlanSwitch(plan);
        }
    };

    const handleConfirmPurchase = async () => {
        if (!selectedPlan) throw new Error("No hay un plan seleccionado para la compra.");
        
        const newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
        const expiresAt = firebase.firestore.Timestamp.fromDate(newExpiryDate);

        const newMembership: Membership = {
            planId: selectedPlan.id,
            status: 'active',
            expiresAt: expiresAt,
        };

        await updateUserProfile(user.uid, { membership: newMembership });
        onProfileUpdate({ membership: newMembership });
        setFeedbackMessage({ type: 'success', text: `¡Felicidades! Has actualizado al ${selectedPlan.name}.` });
        setSelectedPlan(null);
    };

    const currentPlanId = userProfile.membership?.planId;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Gestionar Membresía</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Mejora tu plan para acceder a más beneficios y potenciar tu experiencia.</p>

            {feedbackMessage && (
              <div className={`p-4 rounded-lg mb-6 text-sm ${feedbackMessage.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'}`}>
                {feedbackMessage.text}
              </div>
            )}

            {loading ? (
                <div className="text-center text-gray-500 dark:text-gray-400">Cargando planes...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map(plan => {
                        const colors = planColors[plan.id] || planColors.seeker;
                        const isCurrentPlan = plan.id === currentPlanId;

                        return (
                            <div key={plan.id} className={`relative rounded-2xl p-8 ring-1 flex flex-col ${colors.bg} ${isCurrentPlan ? `ring-2 ${colors.text.replace('text-', 'ring-')}` : colors.ring}`}>
                                {isCurrentPlan && (
                                     <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                        <div className={`flex items-center justify-center px-4 py-1 ${colors.text.replace('text-', 'bg-')} bg-opacity-20 ${colors.text} rounded-full text-sm font-semibold`}>
                                            <StarIcon className="w-4 h-4 mr-2" />
                                            Plan Actual
                                        </div>
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                <p className="mt-4 flex-grow text-gray-600 dark:text-gray-400">{plan.description}</p>
                                <div className="mt-8">
                                    <p className="text-5xl font-bold text-gray-900 dark:text-white">
                                        ${plan.price}
                                        {plan.price > 0 && <span className="text-lg font-medium text-gray-500 dark:text-gray-400 ml-2">/ mes</span>}
                                    </p>
                                </div>
                                <ul className="mt-8 space-y-4 flex-grow">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <div className="flex-shrink-0"><TagIcon className={`w-6 h-6 ${colors.text}`} /></div>
                                            <p className="ml-3 text-left text-gray-700 dark:text-gray-300">{feature}</p>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-10">
                                    <Button 
                                        onClick={() => handleSelectPlan(plan)} 
                                        className={`w-full ${isCurrentPlan ? 'cursor-not-allowed' : colors.button}`}
                                        disabled={isCurrentPlan || (isProcessing && selectedPlan?.id === plan.id)}
                                    >
                                        {isCurrentPlan ? 'Tu Plan Actual' :
                                         (isProcessing && selectedPlan?.id === plan.id) ? 'Cambiando...' :
                                         'Seleccionar Plan'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
             {selectedPlan && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedPlan(null);
                    }}
                    onConfirm={handleConfirmPurchase}
                    amount={selectedPlan.price}
                    itemDescription={`Membresía: ${selectedPlan.name}`}
                />
            )}
        </div>
    );
};

export default UpgradeMembershipPage;
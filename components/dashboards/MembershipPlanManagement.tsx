import React, { useState, useEffect } from 'react';
import { type MembershipPlanDetails, type AppConfig } from '../../types';
import { updateMembershipPlan } from '../../services/firebase';
import Button from '../Button';
import EditMembershipPlanModal from '../EditMembershipPlanModal';
import PencilIcon from '../icons/PencilIcon';
import DollarSignIcon from '../icons/DollarSignIcon';

interface MembershipPlanManagementProps {
    plans: MembershipPlanDetails[];
    onPlansUpdate: (updatedPlans: MembershipPlanDetails[]) => void;
    appConfig: AppConfig | null;
    onConfigUpdate: (data: Partial<AppConfig>) => Promise<void>;
}

const MembershipPlanManagement: React.FC<MembershipPlanManagementProps> = ({ plans, onPlansUpdate, appConfig, onConfigUpdate }) => {
    const [editingPlan, setEditingPlan] = useState<MembershipPlanDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [unlockFee, setUnlockFee] = useState<number>(0);
    const [isSavingFee, setIsSavingFee] = useState(false);

    useEffect(() => {
        if (appConfig) {
            setUnlockFee(appConfig.unlockFee);
        }
    }, [appConfig]);

    const handleOpenModal = (plan: MembershipPlanDetails) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
        setFeedbackMessage(null);
    };

    const handleCloseModal = () => {
        setEditingPlan(null);
        setIsModalOpen(false);
    };

    const handleSavePlan = async (planId: string, data: Partial<Omit<MembershipPlanDetails, 'id'>>) => {
        try {
            await updateMembershipPlan(planId, data);
            const updatedPlans = plans.map(p => p.id === planId ? { ...p, ...data } : p);
            onPlansUpdate(updatedPlans);
            setFeedbackMessage({ type: 'success', text: '¡Plan actualizado correctamente!' });
            handleCloseModal();
        } catch (err) {
            setFeedbackMessage({ type: 'error', text: 'Error al actualizar el plan.' });
            console.error(err);
        }
    };
    
    const handleSaveUnlockFee = async () => {
        if (unlockFee < 0) return;
        setIsSavingFee(true);
        await onConfigUpdate({ unlockFee: Number(unlockFee) });
        setIsSavingFee(false);
    }


    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Gestionar Planes y Tarifas</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Aquí puedes editar los detalles de cada plan y configurar las tarifas de la plataforma.</p>

            {feedbackMessage && (
              <div className={`p-3 rounded-lg mb-4 text-sm ${feedbackMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {feedbackMessage.text}
              </div>
            )}
            
            <div className="space-y-4">
                {plans.map(plan => (
                    <div key={plan.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
                        <div className="flex-grow">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{plan.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                            <p className="font-bold text-gray-800 dark:text-gray-200 mt-2">${plan.price} / mes</p>
                        </div>
                        <div className="mt-4 sm:mt-0 sm:ml-6">
                            <Button
                                onClick={() => handleOpenModal(plan)}
                                variant="secondary"
                                className="!w-auto !px-4 !py-2"
                            >
                                <PencilIcon />
                                <span className="ml-2">Editar</span>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Configuración General</h2>
                 <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label htmlFor="unlockFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tarifa de Desbloqueo de Publicación</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Precio para que un usuario no registrado o sin membresía vea los detalles completos de una publicación.</p>
                    <div className="flex items-center gap-4">
                         <div className="relative flex-grow">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <DollarSignIcon className="w-5 h-5 text-gray-400" />
                            </span>
                             <input 
                                id="unlockFee"
                                type="number"
                                value={unlockFee}
                                onChange={e => setUnlockFee(Number(e.target.value))}
                                min="0"
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white transition"
                            />
                        </div>
                        <Button onClick={handleSaveUnlockFee} disabled={isSavingFee} className="!w-auto">
                            {isSavingFee ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                 </div>
            </div>

            <EditMembershipPlanModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSavePlan}
                plan={editingPlan}
            />
        </div>
    );
};

export default MembershipPlanManagement;
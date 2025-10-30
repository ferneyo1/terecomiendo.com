import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import Button from './Button';
import CloseIcon from './icons/CloseIcon';
import { getMembershipPlans } from '../services/firebase';
import { type UserProfile, type Membership, type MembershipPlanDetails } from '../types';

interface ManageMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (uid: string, newMembership: Membership) => Promise<void>;
  userProfile: UserProfile | null;
}

const ManageMembershipModal: React.FC<ManageMembershipModalProps> = ({ isOpen, onClose, onSave, userProfile }) => {
  const [planId, setPlanId] = useState<string>('');
  const [duration, setDuration] = useState<'none' | '1m' | '6m' | '1y'>('none');
  const [loading, setLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<MembershipPlanDetails[]>([]);


  useEffect(() => {
    if (userProfile?.membership) {
      setPlanId(userProfile.membership.planId);
      setDuration('none');
    }
  }, [userProfile]);
  
  useEffect(() => {
    const fetchPlans = async () => {
        const plans = await getMembershipPlans();
        setAvailablePlans(plans);
    };
    if (isOpen) {
        fetchPlans();
    }
  }, [isOpen]);

  if (!isOpen || !userProfile) {
    return null;
  }

  const handleSave = async () => {
    if (!planId) return;

    setLoading(true);

    let expiresAt: firebase.firestore.Timestamp | null = userProfile.membership?.expiresAt || null;

    if (duration !== 'none') {
        const newExpiryDate = new Date();
        if (duration === '1m') newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
        if (duration === '6m') newExpiryDate.setMonth(newExpiryDate.getMonth() + 6);
        if (duration === '1y') newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
        expiresAt = firebase.firestore.Timestamp.fromDate(newExpiryDate);
    } else if (planId !== userProfile.membership?.planId) {
        expiresAt = userProfile.membership?.expiresAt || null;
    }


    const newMembership: Membership = {
        planId,
        status: 'active',
        expiresAt,
    };

    await onSave(userProfile.uid, newMembership);
    setLoading(false);
  };

  const currentExpiry = userProfile.membership?.expiresAt?.toDate().toLocaleDateString() || 'Nunca';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="membership-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
            aria-label="Cerrar modal"
          >
            <CloseIcon />
          </button>
          <h2 id="membership-modal-title" className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Gestionar Membresía</h2>
           <div className="text-center text-gray-600 dark:text-gray-300 mb-6">
            <p className="font-medium">{userProfile.fullName || userProfile.email}</p>
            <p className="text-sm">Vencimiento actual: {currentExpiry}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="plan-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plan de Membresía
              </label>
              <select 
                id="plan-select"
                value={planId} 
                onChange={(e) => setPlanId(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white transition"
              >
                <option value="" disabled>Selecciona un plan</option>
                {availablePlans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="duration-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Extender Vencimiento
              </label>
              <select 
                id="duration-select"
                value={duration} 
                onChange={(e) => setDuration(e.target.value as 'none' | '1m' | '6m' | '1y')} 
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white transition"
              >
                <option value="none">No extender</option>
                <option value="1m">1 Mes</option>
                <option value="6m">6 Meses</option>
                <option value="1y">1 Año</option>
              </select>
            </div>
            <div className="flex justify-end pt-4 gap-3">
               <Button onClick={onClose} variant="secondary">
                 Cancelar
               </Button>
               <Button onClick={handleSave} disabled={!planId || loading}>
                 {loading ? 'Guardando...' : 'Guardar Cambios'}
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageMembershipModal;

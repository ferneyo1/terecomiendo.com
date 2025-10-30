import React, { useState, useEffect } from 'react';
import Button from './Button';
import CloseIcon from './icons/CloseIcon';
import { type MembershipPlanDetails } from '../types';

interface EditMembershipPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planId: string, data: Partial<Omit<MembershipPlanDetails, 'id'>>) => Promise<void>;
  plan: MembershipPlanDetails | null;
}

const EditMembershipPlanModal: React.FC<EditMembershipPlanModalProps> = ({ isOpen, onClose, onSave, plan }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setPrice(plan.price);
      setDescription(plan.description);
      setFeatures(plan.features.join('\n'));
    }
  }, [plan]);

  if (!isOpen || !plan) {
    return null;
  }

  const handleSave = async () => {
    setLoading(true);
    const updatedData = {
      name,
      price: Number(price),
      description,
      features: features.split('\n').filter(f => f.trim() !== ''),
    };
    await onSave(plan.id, updatedData);
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-plan-modal-title"
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
          <h2 id="edit-plan-modal-title" className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">Editar Plan: {plan.name}</h2>
          
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label htmlFor="plan-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Plan
              </label>
              <input 
                id="plan-name"
                type="text"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white transition"
              />
            </div>
             <div>
              <label htmlFor="plan-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio (mensual)
              </label>
              <input 
                id="plan-price"
                type="number"
                value={price} 
                onChange={(e) => setPrice(Number(e.target.value))} 
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white transition"
              />
            </div>
             <div>
              <label htmlFor="plan-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea 
                id="plan-description"
                rows={3}
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white transition"
              />
            </div>
             <div>
              <label htmlFor="plan-features" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Características (una por línea)
              </label>
              <textarea 
                id="plan-features"
                rows={5}
                value={features} 
                onChange={(e) => setFeatures(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white transition"
              />
            </div>
            <div className="flex justify-end pt-4 gap-3">
               <Button onClick={onClose} variant="secondary">
                 Cancelar
               </Button>
               <Button onClick={handleSave} disabled={loading}>
                 {loading ? 'Guardando...' : 'Guardar Cambios'}
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMembershipPlanModal;

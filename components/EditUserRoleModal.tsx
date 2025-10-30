import React, { useState, useEffect } from 'react';
import Button from './Button';
import CloseIcon from './icons/CloseIcon';
import { UserRole, type UserProfile } from '../types';

interface EditUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (uid: string, newRole: UserRole) => Promise<void>;
  userProfile: UserProfile | null;
}

const EditUserRoleModal: React.FC<EditUserRoleModalProps> = ({ isOpen, onClose, onSave, userProfile }) => {
  const [newRole, setNewRole] = useState<UserRole | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setNewRole(userProfile.role);
    }
  }, [userProfile]);

  if (!isOpen || !userProfile) {
    return null;
  }

  const handleSave = async () => {
    if(newRole && newRole !== userProfile.role) {
      setLoading(true);
      await onSave(userProfile.uid, newRole as UserRole);
      setLoading(false);
    }
  };
  
  const canSave = newRole && newRole !== userProfile.role;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-role-modal-title"
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
          <h2 id="edit-role-modal-title" className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Editar Rol de Usuario</h2>
          <div className="text-center text-gray-600 dark:text-gray-300 mb-6">
            <p className="font-medium">{userProfile.fullName || userProfile.email}</p>
            <p className="text-sm">{userProfile.email}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rol
              </label>
              <select 
                id="role-select"
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value as UserRole)} 
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white transition"
              >
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end pt-4 gap-3">
               <Button onClick={onClose} variant="secondary">
                 Cancelar
               </Button>
               <Button onClick={handleSave} disabled={!canSave || loading}>
                 {loading ? 'Guardando...' : 'Guardar Cambios'}
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserRoleModal;

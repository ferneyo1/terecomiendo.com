import React, { useState, useRef, useEffect } from 'react';
import { type User, updateUserProfile, uploadAvatar } from '../services/firebase';
import { type UserProfile, type MembershipPlanDetails, UserRole } from '../types';
import Button from './Button';
import UserIcon from './icons/UserIcon';
import Avatar from './Avatar';
import CameraIcon from './icons/CameraIcon';
import LocationIcon from './icons/LocationIcon';
import PostalCodeIcon from './icons/PostalCodeIcon';
import PhoneIcon from './icons/PhoneIcon';
import PaymentMethods from './PaymentMethods';

interface ProfilePageProps {
  user: User;
  userProfile: UserProfile;
  onProfileUpdate: (updatedData: Partial<UserProfile>) => void;
  onDirtyChange: (isDirty: boolean) => void;
  membershipPlans: MembershipPlanDetails[];
  setActiveView?: (view: any) => void;
  userRole?: UserRole;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, userProfile, onProfileUpdate, onDirtyChange, membershipPlans, setActiveView, userRole }) => {
  const [fullName, setFullName] = useState(userProfile.fullName || '');
  const [address, setAddress] = useState(userProfile.address || '');
  const [postalCode, setPostalCode] = useState(userProfile.postalCode || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phoneNumber || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset form state if the user profile prop changes from the outside
    // This happens after a successful save or when discarding changes.
    setFullName(userProfile.fullName || '');
    setAddress(userProfile.address || '');
    setPostalCode(userProfile.postalCode || '');
    setPhoneNumber(userProfile.phoneNumber || '');
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [userProfile]);

  useEffect(() => {
    const isDirty =
      fullName !== (userProfile.fullName || '') ||
      address !== (userProfile.address || '') ||
      postalCode !== (userProfile.postalCode || '') ||
      phoneNumber !== (userProfile.phoneNumber || '') ||
      avatarFile !== null;
    onDirtyChange(isDirty);
  }, [fullName, address, postalCode, phoneNumber, avatarFile, userProfile, onDirtyChange]);


  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setSuccess('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneError || addressError) {
      setError('Por favor, corrige los errores en el formulario.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const updatedData: Partial<UserProfile> = {};

      if (avatarFile) {
        setUploadProgress(0);
        const avatarUrl = await uploadAvatar(user.uid, avatarFile, setUploadProgress);
        updatedData.avatarUrl = avatarUrl;
      }
      if (fullName !== userProfile.fullName) updatedData.fullName = fullName;
      if (address !== userProfile.address) updatedData.address = address;
      if (postalCode !== userProfile.postalCode) updatedData.postalCode = postalCode;
      if (phoneNumber !== userProfile.phoneNumber) updatedData.phoneNumber = phoneNumber;

      if (Object.keys(updatedData).length > 0) {
        await updateUserProfile(user.uid, updatedData);
        onProfileUpdate(updatedData);
        setSuccess('¡Perfil actualizado con éxito!');
        // Resetting avatar state is handled by the useEffect that watches userProfile
      } else {
        setSuccess('No hay cambios que guardar.');
      }
    } catch (err) {
      setError('No se pudo actualizar el perfil. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };
  
  const createChangeHandler = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setSuccess('');
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    setSuccess('');
    
    const phoneRegex = /^[\d\s-]*$/;
    if (value && !phoneRegex.test(value)) {
      setPhoneError('Formato no válido. Solo números, espacios y guiones.');
    } else {
      setPhoneError('');
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    setSuccess('');
    
    const addressRegex = /^[a-zA-Z0-9\s,.\-]*$/;
    if (value && !addressRegex.test(value)) {
      setAddressError('Formato no válido. Solo letras, números y .,-');
    } else {
      setAddressError('');
    }
  };

  const formatExpiresAt = (timestamp: any): string => {
    if (!timestamp) return 'Nunca';
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
    }
    return 'Fecha inválida';
  };

  const userPlan = membershipPlans.find(p => p.id === userProfile.membership?.planId);
  const planName = userPlan ? userPlan.name : 'No asignado';

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Gestionar Perfil</h2>
      
      <div className="flex flex-col items-center space-y-4 mb-8">
        <div className="relative">
          <Avatar avatarUrl={avatarPreview || userProfile.avatarUrl} size={128} />
          {uploadProgress !== null && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" className="text-gray-600" fill="transparent" />
                    <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" className="text-indigo-400" fill="transparent"
                        strokeDasharray={2 * Math.PI * 35}
                        strokeDashoffset={(2 * Math.PI * 35) * (1 - (uploadProgress || 0) / 100)}
                        style={{ transition: 'stroke-dashoffset 0.3s' }}
                    />
                </svg>
                <span className="absolute text-white font-bold text-lg">{`${Math.round(uploadProgress || 0)}%`}</span>
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 shadow-md transition-transform transform hover:scale-110"
            aria-label="Cambiar foto de perfil"
            disabled={loading}
          >
            <CameraIcon />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
      
      <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-0">Detalles de la Membresía</h3>
            {userRole !== UserRole.Admin && setActiveView && (
              <Button onClick={() => setActiveView('upgradeMembership')} variant="secondary" className="!w-auto !py-2 !px-4">
                Cambiar Plan
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-4">
              <div>
                  <span className="block text-gray-500 dark:text-gray-400">Plan Actual</span>
                  <span className="font-medium text-gray-900 dark:text-white">{planName}</span>
              </div>
              <div>
                  <span className="block text-gray-500 dark:text-gray-400">Estado</span>
                  <span className={`font-medium capitalize ${userProfile.membership?.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {userProfile.membership?.status?.replace('_', ' ') || 'N/A'}
                  </span>
              </div>
              <div>
                  <span className="block text-gray-500 dark:text-gray-400">Vence el</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                      {formatExpiresAt(userProfile.membership?.expiresAt)}
                  </span>
              </div>
          </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
              <input type="email" value={user.email || ''} disabled className="w-full px-4 py-3 mt-1 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg text-gray-500 dark:text-gray-300 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
              <input type="text" value={userProfile.role} disabled className="w-full px-4 py-3 mt-1 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg text-gray-500 dark:text-gray-300 cursor-not-allowed" />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
              <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon /></span>
                  <input id="fullName" type="text" placeholder="Tu nombre completo" value={fullName} onChange={createChangeHandler(setFullName)} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-300 transition" />
              </div>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
            <div className="relative mt-1">
              {/* Fix: Pass className to LocationIcon as it no longer has a hardcoded className */}
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LocationIcon className="w-5 h-5 text-gray-400" /></span>
              <input 
                id="address" 
                type="text" 
                placeholder="Tu dirección" 
                value={address} 
                onChange={handleAddressChange} 
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 focus:ring-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-300 transition ${addressError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-indigo-500'}`}
              />
            </div>
             {addressError && <p className="text-xs text-red-500 mt-1">{addressError}</p>}
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código Postal</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><PostalCodeIcon /></span>
              <input id="postalCode" type="text" placeholder="C.P." value={postalCode} onChange={createChangeHandler(setPostalCode)} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-300 transition" />
            </div>
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><PhoneIcon /></span>
              <input 
                id="phoneNumber" 
                type="tel" 
                placeholder="Tu teléfono" 
                value={phoneNumber} 
                onChange={handlePhoneChange} 
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 focus:ring-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-300 transition ${phoneError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-indigo-500'}`}
              />
            </div>
             {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
          </div>
        </div>
        
        {error && <p className="text-sm text-center text-red-700 dark:text-red-400 pt-2">{error}</p>}
        {success && <p className="text-sm text-center text-green-700 dark:text-green-400 pt-2">{success}</p>}

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading || !!phoneError || !!addressError} className="w-full sm:w-auto">
                {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
        </div>
      </form>

      {userProfile.role !== UserRole.Admin && (
        <>
            <div className="my-8 border-t border-gray-200 dark:border-gray-700"></div>
            <PaymentMethods user={user} userProfile={userProfile} onProfileUpdate={onProfileUpdate} />
        </>
      )}
    </div>
  );
};

export default ProfilePage;
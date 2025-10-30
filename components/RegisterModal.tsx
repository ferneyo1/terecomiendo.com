import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { registerUser, type AuthError } from '../services/firebase';
import Button from './Button';
import CloseIcon from './icons/CloseIcon';
import AtIcon from './icons/AtIcon';
import LockIcon from './icons/LockIcon';
import UserIcon from './icons/UserIcon';
import CheckIcon from './icons/CheckIcon';

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  forceSeekerRole?: boolean;
  // Fix: Add defaultRole to props to fix type error in App.tsx
  defaultRole?: UserRole;
}

const PasswordCriterion: React.FC<{ label: string; met: boolean }> = ({ label, met }) => (
    <div className={`flex items-center transition-colors duration-300 ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
          {met ? <CheckIcon className="w-full h-full" /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>}
        </div>
        <span>{label}</span>
    </div>
);


const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onSwitchToLogin, forceSeekerRole = false, defaultRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Fix: Initialize role state with defaultRole prop if available.
  const [role, setRole] = useState<UserRole>(defaultRole || UserRole.Seeker);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  useEffect(() => {
    if (forceSeekerRole) {
      setRole(UserRole.Seeker);
    }
  }, [forceSeekerRole]);

  useEffect(() => {
    // Set initial focus on the close button
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  const validatePassword = (pass: string) => {
    setPasswordCriteria({
      minLength: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };
  
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
        setError('La contraseña no cumple con todos los requisitos de seguridad.');
        return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await registerUser(email, password, role);
      onClose();
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message || 'Error al registrar. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-modal-title"
      >
        <div className="relative p-6 sm:p-8">
          <button 
            ref={closeButtonRef}
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
            aria-label="Cerrar modal"
          >
            <CloseIcon />
          </button>
          <h2 id="register-modal-title" className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">Crear Cuenta</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">Únete a nuestra plataforma</p>

          {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><AtIcon /></span>
              <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-300 transition" />
            </div>
            
            <div>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                    <input type="password" placeholder="Contraseña" value={password} onChange={handlePasswordChange} required className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-300 transition" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2 px-1">
                    <PasswordCriterion label="Mínimo 8 caracteres" met={passwordCriteria.minLength} />
                    <PasswordCriterion label="Una mayúscula" met={passwordCriteria.uppercase} />
                    <PasswordCriterion label="Una minúscula" met={passwordCriteria.lowercase} />
                    <PasswordCriterion label="Un número" met={passwordCriteria.number} />
                    <PasswordCriterion label="Un caracter especial" met={passwordCriteria.specialChar} />
                </div>
            </div>
            
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
              <input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-300 transition" />
            </div>
            
            <div>
              <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tu Rol en la Plataforma</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><UserIcon /></span>
                <select 
                  id="role-select"
                  value={role} 
                  onChange={(e) => setRole(e.target.value as UserRole)} 
                  required 
                  disabled={forceSeekerRole}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg appearance-none text-gray-900 dark:text-white transition disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  aria-describedby={forceSeekerRole ? "role-description" : undefined}
                >
                  {Object.values(UserRole).filter(r => r !== UserRole.Admin).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {forceSeekerRole && (
                  <p id="role-description" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Tu rol se ha fijado como "Buscador" para completar la postulación al empleo.
                  </p>
              )}
            </div>

            <Button type="submit" disabled={loading || !isPasswordValid} className="w-full !mt-6">
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
            ¿Ya tienes una cuenta?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200">
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
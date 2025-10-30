import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import Avatar from './Avatar';
import { type User } from '../services/firebase';
import { type UserProfile, UserRole } from '../types';
import HomeIcon from './icons/HomeIcon';
import UserIcon from './icons/UserIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import LogoutIcon from './icons/LogoutIcon';
import LogoIcon from './icons/LogoIcon';


interface NavbarProps {
  user: User | null;
  userProfile: UserProfile | null;
  currentView: 'landing' | 'dashboard';
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
  onNavigate: (view: 'landing' | 'dashboard', initialDashboardView?: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, userProfile, onLoginClick, onRegisterClick, onLogout, onNavigate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getRoleSpecificLink = () => {
    if (!userProfile) return null;
    switch (userProfile.role) {
      case UserRole.Recommender:
        return { label: 'Mis Recomendaciones', view: 'myRecommendations', icon: <BriefcaseIcon className="w-5 h-5" /> };
      case UserRole.Professional:
        return { label: 'Mis Publicaciones', view: 'myListings', icon: <BriefcaseIcon className="w-5 h-5" /> };
      case UserRole.Seeker:
        return { label: 'Mis Postulaciones', view: 'myApplications', icon: <BriefcaseIcon className="w-5 h-5" /> };
      case UserRole.Admin:
        return { label: 'Publicaciones', view: 'listings', icon: <BriefcaseIcon className="w-5 h-5" /> };
      default:
        return null;
    }
  };

  const roleLink = getRoleSpecificLink();
  
  const handleNavigation = (view: 'dashboard', initialView: string) => {
    onNavigate(view, initialView);
    setIsDropdownOpen(false);
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <button 
              onClick={() => onNavigate('landing')} 
              className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md p-1"
              aria-label="Ir a la página de inicio de TeRecomiendo"
            >
                <LogoIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:block text-2xl font-bold text-gray-900 dark:text-white">
                    TeRecomiendo
                </span>
            </button>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user && userProfile ? (
                 <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(prev => !prev)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800">
                        <Avatar avatarUrl={userProfile.avatarUrl} size={40} />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in-down">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <p className="font-semibold text-gray-800 dark:text-white truncate">{userProfile.fullName || user.email}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </div>
                            <ul className="py-2">
                                <li><button onClick={() => handleNavigation('dashboard', 'overview')} className="dropdown-item"><HomeIcon className="w-5 h-5" /> Mi Dashboard</button></li>
                                <li><button onClick={() => handleNavigation('dashboard', 'profile')} className="dropdown-item"><UserIcon className="w-5 h-5" /> Mi Perfil</button></li>
                                {roleLink && <li><button onClick={() => handleNavigation('dashboard', roleLink.view)} className="dropdown-item">{roleLink.icon} {roleLink.label}</button></li>}
                                <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                                <li><button onClick={onLogout} className="dropdown-item text-red-600 dark:text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/40"><LogoutIcon /> Cerrar Sesión</button></li>
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <Button onClick={onLoginClick} variant="secondary" className="!w-auto !px-3 sm:!px-4 !py-2 text-sm sm:text-base">
                        Iniciar Sesión
                    </Button>
                    <Button onClick={onRegisterClick} className="!w-auto !px-3 sm:!px-4 !py-2 text-sm sm:text-base">
                        Registrarse
                    </Button>
                </>
            )}
          </div>
        </div>
      </nav>
      <style>{`
        .dropdown-item {
            display: flex;
            align-items: center;
            width: 100%;
            padding: 0.75rem 1rem;
            font-weight: 500;
            text-align: left;
            font-size: 0.9rem;
            color: #374151;
            transition: background-color 0.2s;
        }
        .dark .dropdown-item {
            color: #d1d5db;
        }
        .dropdown-item:hover {
            background-color: #f3f4f6;
        }
        .dark .dropdown-item:hover {
            background-color: #374151;
        }
        .dropdown-item:focus-visible {
            outline: none;
            background-color: #f3f4f6;
            box-shadow: inset 0 0 0 2px #4f46e5;
        }
        .dark .dropdown-item:focus-visible {
            background-color: #374151;
            box-shadow: inset 0 0 0 2px #818cf8;
        }
        .dropdown-item svg {
            margin-right: 0.75rem;
            width: 1.25rem;
            height: 1.25rem;
            color: #6b7280;
        }
        .dark .dropdown-item svg {
            color: #9ca3af;
        }
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.2s ease-out;
        }
      `}</style>
    </header>
  );
};

export default Navbar;
import React from 'react';
// Fix: Corrected module import. `UserRole` is exported from `../../types`, not `../../services/firebase`.
import { type User } from '../../services/firebase';
import { UserRole, type UserProfile } from '../../types';
import Button from '../Button';
import Avatar from '../Avatar';
import HomeIcon from '../icons/HomeIcon';
import UserIcon from '../icons/UserIcon';
import ClipboardListIcon from '../icons/ClipboardListIcon';
import UsersIcon from '../icons/UsersIcon';
import ArrowUpCircleIcon from '../icons/ArrowUpCircleIcon';
import LightbulbIcon from '../icons/LightbulbIcon';
import BriefcaseIcon from '../icons/BriefcaseIcon';
import CreditCardIcon from '../icons/CreditCardIcon';

// Fix: Add 'completeProfileAndPay' to support SeekerDashboard navigation.
type DashboardView = 'overview' | 'profile' | 'posts' | 'membershipPlans' | 'users' | 'upgradeMembership' | 'listings' | 'myListings' | 'myRecommendations' | 'myApplications' | 'paymentVerifications' | 'completeProfileAndPay';

interface DashboardSidebarProps {
  user: User;
  userProfile: UserProfile;
  // Fix: Use a general type to avoid conflicts with parent components' specific view types.
  activeView: any;
  setActiveView: (view: any) => void;
  onLogout: () => void;
  pendingVerificationCount?: number;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ user, userProfile, activeView, setActiveView, onLogout, pendingVerificationCount }) => {
  // Fix: Replace JSX.Element with React.ReactElement to resolve namespace error.
  const navItems: { id: string, label: string, icon: React.ReactElement, count?: number }[] = [
    { id: 'overview', label: 'Resumen', icon: <HomeIcon /> },
    { id: 'profile', label: 'Mi Perfil', icon: <UserIcon /> },
  ];

  if (userProfile.role === UserRole.Admin) {
    navItems.push({ id: 'users', label: 'Usuarios', icon: <UsersIcon /> });
    navItems.push({ id: 'listings', label: 'Publicaciones', icon: <BriefcaseIcon /> });
    navItems.push({ 
      id: 'paymentVerifications', 
      label: 'Verificaciones', 
      icon: <CreditCardIcon />, 
      count: pendingVerificationCount 
    });
    navItems.push({ id: 'membershipPlans', label: 'Gestionar Planes', icon: <ClipboardListIcon /> });
  } else if (userProfile.role === UserRole.Recommender) {
    navItems.push({ id: 'myRecommendations', label: 'Mis Recomendaciones', icon: <BriefcaseIcon /> });
    navItems.push({ id: 'upgradeMembership', label: 'Membresías', icon: <ArrowUpCircleIcon /> });
  } else if (userProfile.role === UserRole.Professional) {
    navItems.push({ id: 'myListings', label: 'Mis Publicaciones', icon: <BriefcaseIcon /> });
    navItems.push({ id: 'upgradeMembership', label: 'Membresías', icon: <ArrowUpCircleIcon /> });
  } else { // Seeker
    navItems.push({ id: 'myApplications', label: 'Mis Postulaciones', icon: <ClipboardListIcon /> });
    navItems.push({ id: 'upgradeMembership', label: 'Membresías', icon: <ArrowUpCircleIcon /> });
  }

  const getNavItemClass = (id: DashboardView) => {
    return `flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 font-medium ${
      activeView === id
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
        : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
    }`;
  };

  return (
    <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col h-full">
        <div className="flex flex-col items-center text-center pb-6 border-b border-gray-200 dark:border-gray-700">
          <Avatar avatarUrl={userProfile.avatarUrl} size={96} />
          <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            {userProfile.fullName || userProfile.email.split('@')[0]}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
        
        <nav className="flex-grow mt-6 space-y-2">
          {navItems.map(item => (
             <button key={item.id} onClick={() => setActiveView(item.id as DashboardView)} className={getNavItemClass(item.id as DashboardView)}>
                <span className="mr-3">{item.icon}</span>
                <span className="flex-grow text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {item.count}
                  </span>
                )}
             </button>
          ))}
        </nav>

        <div className="mt-6">
          <Button onClick={onLogout} variant="secondary" className="w-full">
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
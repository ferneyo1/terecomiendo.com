
import React from 'react';
import { type User } from '../../services/firebase';
import { type UserProfile } from '../../types';
import Button from '../Button';
import Avatar from '../Avatar';

interface DashboardHeaderProps {
  user: User;
  userProfile: UserProfile;
  onLogout: () => void;
  onNavigateToProfile: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, userProfile, onLogout, onNavigateToProfile }) => {
  return (
    <div className="w-full p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl shadow-lg flex flex-col md:flex-row items-center gap-6 mb-8">
      <Avatar avatarUrl={userProfile.avatarUrl} size={96} />
      <div className="flex-grow text-center md:text-left">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {userProfile.fullName || userProfile.email.split('@')[0]}
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-300">
          {user.email}
        </p>
         <p className="mt-1 text-sm font-medium text-indigo-700 dark:text-indigo-200">
          Rol: {userProfile.role}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full md:w-auto">
        <Button onClick={onNavigateToProfile} variant="secondary" className="w-full sm:w-auto">
          Gestionar Perfil
        </Button>
        <Button onClick={onLogout} className="w-full sm:w-auto">
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
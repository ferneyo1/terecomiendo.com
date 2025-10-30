import React, { useState, useEffect } from 'react';
// Fix: Import User type from local firebase service to fix module resolution error.
import type { User } from '../../services/firebase';
import { getMembershipPlans } from '../../services/firebase';
import { type UserProfile, type MembershipPlanDetails, UserRole } from '../../types';
import DashboardSidebar from './DashboardSidebar';
import ProfilePage from '../ProfilePage';
import ConfirmationModal from '../ConfirmationModal';
import UpgradeMembershipPage from './UpgradeMembershipPage';
import MyListings from './professional/MyListings';

type DashboardView = 'overview' | 'profile' | 'upgradeMembership' | 'myListings';

interface DashboardProps {
  user: User;
  userProfile: UserProfile;
  onLogout: () => void;
  onProfileUpdate: (updatedData: Partial<UserProfile>) => void;
  initialView: DashboardView;
}

const ProfessionalDashboard: React.FC<DashboardProps> = ({ user, userProfile, onLogout, onProfileUpdate, initialView }) => {
  const [activeView, setActiveView] = useState<DashboardView>(initialView);
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [nextView, setNextView] = useState<DashboardView | null>(null);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlanDetails[]>([]);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);
  
  useEffect(() => {
    getMembershipPlans().then(setMembershipPlans);
  }, []);

  const handleNavigation = (targetView: DashboardView) => {
    if (activeView === 'profile' && isProfileDirty && targetView !== 'profile') {
      setNextView(targetView);
      setShowConfirmModal(true);
    } else {
      setActiveView(targetView);
    }
  };

  const handleConfirmNavigation = () => {
    if (nextView) {
      setIsProfileDirty(false); 
      setActiveView(nextView);
    }
    setShowConfirmModal(false);
    setNextView(null);
  };
  
  const handleCancelNavigation = () => {
    setShowConfirmModal(false);
    setNextView(null);
  };
  
  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    onProfileUpdate(updatedData);
    setIsProfileDirty(false);
  }

  const renderTrialBanner = () => {
    if (userProfile.role !== UserRole.Professional) return null;

    const isPaidActive = userProfile.membership?.status === 'active' && userProfile.membership.expiresAt;
    if (isPaidActive) return null;

    const trialStart = userProfile.listingTrialStartedAt?.toDate();
    if (!trialStart) return null;
    
    const now = new Date();
    const trialEndDate = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    const isTrialActive = now < trialEndDate;
    const listingsMade = userProfile.listingsMade || 0;
    const listingsRemaining = 1 - listingsMade;
    
    let message = '';
    let type: 'info' | 'warning' | 'error' = 'info';

    if (isTrialActive) {
        if (listingsRemaining > 0) {
            message = `¡Bienvenido! Tienes ${listingsRemaining} publicación gratuita restante en tu mes de prueba.`;
            type = 'info';
        } else {
            message = 'Has utilizado tu publicación gratuita de prueba. Para seguir publicando, por favor, mejora tu membresía.';
            type = 'warning';
        }
    } else {
        message = 'Tu período de prueba ha terminado. Para publicar nuevos servicios, por favor, mejora tu membresía.';
        type = 'error';
    }
    
    const bannerColors = {
        info: 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300',
        warning: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300',
        error: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
    }

    return (
      <div className={`p-4 rounded-lg mb-6 text-center ${bannerColors[type]}`}>
        <p>{message}</p>
      </div>
    );
  };


  const renderContent = () => {
    switch (activeView) {
      case 'profile':
        return <ProfilePage user={user} userProfile={userProfile} onProfileUpdate={handleProfileUpdate} onDirtyChange={setIsProfileDirty} membershipPlans={membershipPlans} setActiveView={handleNavigation} userRole={userProfile.role} />;
      case 'upgradeMembership':
        return <UpgradeMembershipPage user={user} userProfile={userProfile} onProfileUpdate={onProfileUpdate} />;
      case 'myListings':
        return <MyListings user={user} userProfile={userProfile} onProfileUpdate={onProfileUpdate} />;
      case 'overview':
      default:
        return (
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            {renderTrialBanner()}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">Gestiona tu Perfil Profesional</h1>
              <div className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                <p>Potencia tu visibilidad y haz que tus servicios lleguen a más personas. Aquí puedes mostrar tu trabajo para que los recomendadores compartan tu perfil y los buscadores te encuentren.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 w-full max-w-7xl mx-auto">
        <DashboardSidebar 
          user={user}
          userProfile={userProfile}
          activeView={activeView}
          setActiveView={handleNavigation}
          onLogout={onLogout}
        />
        <main className="flex-grow">
          {renderContent()}
        </main>
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelNavigation}
        onConfirm={handleConfirmNavigation}
        title="Cambios sin guardar"
        message="Tienes cambios sin guardar. ¿Estás seguro de que quieres salir y descartarlos?"
        confirmText="Descartar Cambios"
        cancelText="Permanecer"
      />
    </>
  );
};

export default ProfessionalDashboard;
import React, { useState, useEffect, useCallback } from 'react';
// Fix: Import User type from local firebase service to fix module resolution error.
import type { User } from '../../services/firebase';
import { getMembershipPlans, getJobListingsByRecommender } from '../../services/firebase';
import { type UserProfile, type MembershipPlanDetails, UserRole, type JobListing } from '../../types';
import DashboardSidebar from './DashboardSidebar';
import ProfilePage from '../ProfilePage';
import ConfirmationModal from '../ConfirmationModal';
import UpgradeMembershipPage from './UpgradeMembershipPage';
import MyRecommendations from './recommender/MyRecommendations';
import Button from '../Button';
import BriefcaseIcon from '../icons/BriefcaseIcon';
import ClockIcon from '../icons/ClockIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import NotificationBell from '../NotificationBell';

type DashboardView = 'overview' | 'profile' | 'upgradeMembership' | 'myRecommendations';

interface DashboardProps {
  user: User;
  userProfile: UserProfile;
  onLogout: () => void;
  onProfileUpdate: (updatedData: Partial<UserProfile>) => void;
  initialView: DashboardView;
}

const RecommenderDashboard: React.FC<DashboardProps> = ({ user, userProfile, onLogout, onProfileUpdate, initialView }) => {
  const [activeView, setActiveView] = useState<DashboardView>(initialView);
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [nextView, setNextView] = useState<DashboardView | null>(null);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlanDetails[]>([]);
  const [listings, setListings] = useState<JobListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);
  
  useEffect(() => {
    getMembershipPlans().then(setMembershipPlans);
  }, []);

  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
        const userListings = await getJobListingsByRecommender(user.uid);
        setListings(userListings);
    } catch (error) {
        console.error("Error fetching listings:", error);
    } finally {
        setLoadingListings(false);
    }
  }, [user.uid]);

  useEffect(() => {
    if (activeView === 'overview') {
      fetchListings();
    }
  }, [activeView, fetchListings]);

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

  const formatExpiresAt = (timestamp: any): string => {
    if (!timestamp) return 'Nunca';
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
    }
    return 'Fecha inválida';
  };

  const renderTrialBanner = () => {
    if (userProfile.role !== UserRole.Recommender) return null;

    // Don't show banner if membership is already active and paid
    const isPaidActive = userProfile.membership?.status === 'active' && userProfile.membership.expiresAt;
    if (isPaidActive) return null;

    const trialStart = userProfile.trialStartedAt?.toDate();
    if (!trialStart) return null;

    const now = new Date();
    const trialEndDate = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    const isTrialActive = now < trialEndDate;
    const postsMade = userProfile.postsMade || 0;
    const postsRemaining = 5 - postsMade;
    
    let message = '';
    let type: 'info' | 'warning' | 'error' = 'info';

    if (isTrialActive) {
      if (postsRemaining > 0) {
        message = `¡Bienvenido! Tienes ${postsRemaining} publicaciones gratuitas restantes en tu mes de prueba.`;
        type = 'info';
      } else {
        message = 'Has utilizado todas tus publicaciones gratuitas de prueba. Para seguir publicando, por favor, mejora tu membresía.';
        type = 'warning';
      }
    } else {
      message = 'Tu período de prueba ha terminado. Para publicar nuevas recomendaciones, por favor, mejora tu membresía.';
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
      case 'myRecommendations':
        return <MyRecommendations user={user} userProfile={userProfile} onProfileUpdate={onProfileUpdate} />;
      case 'overview':
      default:
        const recentListings = listings.slice(0, 5);
        const currentPlan = membershipPlans.find(p => p.id === userProfile.membership?.planId);
        const status = userProfile.membership?.status || 'inactive';
        const expiresAt = formatExpiresAt(userProfile.membership?.expiresAt);

        const totalListings = listings.length;
        const pendingListings = listings.filter(l => l.status === 'pending').length;
        const verifiedListings = listings.filter(l => l.status === 'verified').length;
        
        const statusStyles: { [key: string]: string } = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            inactive: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            expired: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            pending_verification: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        };
        const statusText: { [key: string]: string } = {
            active: 'Activa',
            inactive: 'Inactiva',
            expired: 'Expirada',
            pending_verification: 'Pendiente de Verificación',
        };

        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              {renderTrialBanner()}
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">Tu Espacio para Recomendar</h1>
                <div className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                  <p>Desde aquí puedes compartir esas oportunidades únicas que conoces. Publica una oferta de empleo, un alquiler o recomienda un servicio de confianza para ayudar a tu comunidad.</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Resumen de Publicaciones</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                        <BriefcaseIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalListings}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Totales</p>
                    </div>
                </div>
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                        <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{pendingListings}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
                    </div>
                </div>
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                        <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{verifiedListings}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Verificadas</p>
                    </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Estado de tu Membresía</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Plan Actual</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{currentPlan?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-block ${statusStyles[status]}`}>
                    {statusText[status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Vence el</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{expiresAt}</p>
                </div>
              </div>
              <div className="mt-6 text-center sm:text-right">
                <Button onClick={() => handleNavigation('upgradeMembership')} variant="secondary" className="!w-auto">
                  Gestionar Membresía
                </Button>
              </div>
            </div>

             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Últimas Recomendaciones</h2>
              {loadingListings ? (
                <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
                </div>
              ) : recentListings.length > 0 ? (
                <div className="space-y-4">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentListings.map(listing => (
                      <li key={listing.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                            <BriefcaseIcon className="w-6 h-6" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{listing.jobTitle}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Publicado el: {listing.createdAt?.toDate().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 text-right">
                    <Button variant="secondary" onClick={() => handleNavigation('myRecommendations')} className="!w-auto">
                      Ver Todas
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aún no has hecho ninguna recomendación.</p>
              )}
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
          <div className="flex justify-end mb-4">
              <NotificationBell userProfile={userProfile} />
          </div>
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

export default RecommenderDashboard;
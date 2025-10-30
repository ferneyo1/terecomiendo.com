import React, { useState, useEffect } from 'react';
// Fix: Import User type from local firebase service to fix module resolution error.
import type { User } from '../../services/firebase';
import { getListings, getMembershipPlans, getAppConfig, unlockJobListing } from '../../services/firebase';
import { type UserProfile, type MembershipPlanDetails, UserRole, type JobListing, type AppConfig } from '../../types';
import DashboardSidebar from './DashboardSidebar';
import ProfilePage from '../ProfilePage';
import ConfirmationModal from '../ConfirmationModal';
import UpgradeMembershipPage from './UpgradeMembershipPage';
import MyApplications from './seeker/MyApplications';
import OnboardingFlow from './seeker/OnboardingFlow';
import Button from '../Button';
import PaymentModal from '../PaymentModal';
import DollarSignIcon from '../icons/DollarSignIcon';
import ArrowUpCircleIcon from '../icons/ArrowUpCircleIcon';

type DashboardView = 'overview' | 'profile' | 'upgradeMembership' | 'myApplications' | 'completeProfileAndPay';

interface DashboardProps {
  user: User;
  userProfile: UserProfile;
  onLogout: () => void;
  onProfileUpdate: (updatedData: Partial<UserProfile>) => void;
  initialView: DashboardView;
  jobIdToUnlock?: string;
  onUnlockAndApply?: (jobId: string) => void;
}

const SeekerDashboard: React.FC<DashboardProps> = ({ user, userProfile, onLogout, onProfileUpdate, initialView, jobIdToUnlock, onUnlockAndApply }) => {
  const [activeView, setActiveView] = useState<DashboardView>(initialView);
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [nextView, setNextView] = useState<DashboardView | null>(null);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlanDetails[]>([]);
  const [pendingJob, setPendingJob] = useState<JobListing | null>(null);
  const [loadingPendingJob, setLoadingPendingJob] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);


  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);
  
  useEffect(() => {
    getMembershipPlans().then(setMembershipPlans);
    getAppConfig().then(setAppConfig);
  }, []);

  useEffect(() => {
    const fetchPendingJob = async () => {
        if (jobIdToUnlock) {
            setLoadingPendingJob(true);
            try {
                const allListings = await getListings();
                const job = allListings.find(l => l.id === jobIdToUnlock && l.listingType === 'job');
                if (job) {
                    setPendingJob(job as JobListing);
                }
            } catch (error) {
                console.error("Error fetching pending job:", error);
            } finally {
                setLoadingPendingJob(false);
            }
        } else {
            setPendingJob(null);
        }
    };
    if (activeView === 'overview') {
        fetchPendingJob();
    }
  }, [jobIdToUnlock, activeView]);


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

  const handleUnlock = async () => {
    if (!jobIdToUnlock) return;
    try {
        await unlockJobListing(user.uid, jobIdToUnlock);
        onProfileUpdate({ unlockedListings: [...(userProfile.unlockedListings || []), jobIdToUnlock] });
        handleNavigation('completeProfileAndPay');
    } catch (error) {
        console.error("Failed to unlock job:", error);
        throw new Error('Error al desbloquear. Inténtalo de nuevo.');
    }
  };


  const renderContent = () => {
    switch (activeView) {
      case 'profile':
        return <ProfilePage user={user} userProfile={userProfile} onProfileUpdate={handleProfileUpdate} onDirtyChange={setIsProfileDirty} membershipPlans={membershipPlans} setActiveView={handleNavigation} userRole={userProfile.role} />;
      case 'upgradeMembership':
        return <UpgradeMembershipPage user={user} userProfile={userProfile} onProfileUpdate={onProfileUpdate} />;
      case 'myApplications':
        return <MyApplications user={user} />;
      case 'completeProfileAndPay':
         if (jobIdToUnlock && onUnlockAndApply) {
          return <OnboardingFlow 
            user={user} 
            userProfile={userProfile} 
            onProfileUpdate={onProfileUpdate}
            jobIdToUnlock={jobIdToUnlock}
            onUnlockAndApply={onUnlockAndApply}
            membershipPlans={membershipPlans}
            setActiveView={handleNavigation}
          />
        }
        // Fallback to overview if props are missing
        setActiveView('overview');
        return null;
      case 'overview':
      default:
        if (loadingPendingJob) {
          return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 flex items-center justify-center h-48">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
            </div>
          );
        }

        if (pendingJob) {
            const isProfileComplete = userProfile.fullName && userProfile.address && userProfile.phoneNumber;

            if (!isProfileComplete) {
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Completa tu perfil para continuar</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Para postularte a "{pendingJob.jobTitle}", primero necesitamos que completes tu información personal.
                        </p>
                        <Button onClick={() => handleNavigation('completeProfileAndPay')} className="!w-auto">
                            Completar Perfil
                        </Button>
                    </div>
                );
            }

            return (
                <>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Finaliza tu postulación para "{pendingJob.jobTitle}"</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">Elige una opción para desbloquear los detalles de contacto y enviar tu postulación.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center text-center">
                               <ArrowUpCircleIcon />
                               <h3 className="text-lg font-semibold my-3">Comprar Membresía</h3>
                               <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow mb-4">Acceso ilimitado a todas las publicaciones, soporte prioritario y más beneficios.</p>
                               <Button onClick={() => handleNavigation('upgradeMembership')} variant="secondary" className="w-full">
                                   Ver Planes
                               </Button>
                           </div>
                           <div className="p-6 border-2 border-indigo-500 rounded-lg flex flex-col items-center text-center bg-indigo-50 dark:bg-indigo-900/20">
                               <DollarSignIcon className="w-6 h-6 text-indigo-500" />
                               <h3 className="text-lg font-semibold my-3">Desbloqueo Único</h3>
                               <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow mb-4">Paga una pequeña tarifa para ver los detalles y postularte solo a esta oferta de empleo.</p>
                               <Button onClick={() => setShowPaymentModal(true)} disabled={!appConfig} className="w-full">
                                   {`Pagar $${appConfig?.unlockFee || '...'} ahora`}
                               </Button>
                           </div>
                        </div>
                    </div>
                    {appConfig && <PaymentModal 
                        isOpen={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        onConfirm={handleUnlock}
                        amount={appConfig.unlockFee}
                        itemDescription={`Desbloqueo para: ${pendingJob.jobTitle}`}
                    />}
                </>
            );
        }

        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">Encuentra lo que Buscas</h1>
            <div className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              <p>Explora las mejores recomendaciones de tu zona. Encuentra tu próximo empleo, el lugar ideal para vivir o el profesional que necesitas, todo con el respaldo de una recomendación.</p>
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

export default SeekerDashboard;
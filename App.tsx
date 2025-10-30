import React, { useState, useEffect } from 'react';
import { onAuthChange, logoutUser, getUserProfile } from './services/firebase';
// Fix: Import User type from local firebase service to fix module resolution error.
import type { User } from './services/firebase';
import { UserRole, type UserProfile } from './types';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import AdminDashboard from './components/dashboards/AdminDashboard';
import RecommenderDashboard from './components/dashboards/RecommenderDashboard';
import SeekerDashboard from './components/dashboards/SeekerDashboard';
import ProfessionalDashboard from './components/dashboards/ProfessionalDashboard';
import Navbar from './components/Navbar';
import Button from './components/Button';
import MembershipSection from './components/MembershipSection';
import ListingsSection from './components/ListingsSection';
import TopMembersSection from './components/TopMembersSection';

// Define a type for our route state for better type safety.
interface AppRoute {
  name: 'landing' | 'dashboard';
  initialDashboardView?: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [lockRoleToSeeker, setLockRoleToSeeker] = useState(false);
  const [defaultRole, setDefaultRole] = useState<UserRole | undefined>();
  
  // Refactored state: A single route object manages the application's view.
  const [route, setRoute] = useState<AppRoute>({ name: 'landing', initialDashboardView: 'overview' });

  const [pendingUnlockJobId, setPendingUnlockJobId] = useState<string | null>(null);
  const [jobToAutoOpen, setJobToAutoOpen] = useState<string | null>(null);


  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const profile = await getUserProfile(authUser.uid);
        setUserProfile(profile);
        if (pendingUnlockJobId) {
          // Use the new navigation handler
          handleNavigation('dashboard', 'completeProfileAndPay');
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pendingUnlockJobId]);
  
  // Refactored navigation handler to update the single route state object.
  const handleNavigation = (name: 'landing' | 'dashboard', initialDashboardView: string = 'overview') => {
      setRoute({ name, initialDashboardView });
  };

  const handleLogout = async () => {
    await logoutUser();
    handleNavigation('landing');
  };

  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    if(userProfile) {
      setUserProfile({ ...userProfile, ...updatedData });
    }
  }
  
  const handleLoginRequest = (jobId?: string) => {
    if (jobId) {
      setPendingUnlockJobId(jobId);
    }
    setShowLoginModal(true);
  }

  const handleStartOnboarding = (jobId: string) => {
    setPendingUnlockJobId(jobId);
    handleNavigation('dashboard', 'completeProfileAndPay');
  };
  
  const handleRegisterRequest = (role?: UserRole) => {
      setDefaultRole(role);
      setShowRegisterModal(true);
  }

  const openRegister = () => {
    setShowLoginModal(false);
    if (pendingUnlockJobId) {
        setLockRoleToSeeker(true);
    }
    setShowRegisterModal(true);
  }

  const openLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  }

  // Refactored to use the new route state
  const handleUnlockAndApply = (jobId: string) => {
    setPendingUnlockJobId(null);
    setJobToAutoOpen(jobId);
    setRoute({ name: 'landing' });
  };

  const closeAndResetModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setPendingUnlockJobId(null);
    setLockRoleToSeeker(false);
    setDefaultRole(undefined);
  };

  const renderDashboard = () => {
    if (!user || !userProfile) {
      return null;
    }

    // Read the initial view from the refactored route state.
    const dashboardProps: any = {
        user,
        userProfile,
        onLogout: handleLogout,
        onProfileUpdate: handleProfileUpdate,
        initialView: route.initialDashboardView || 'overview',
    };

    if (pendingUnlockJobId) {
      dashboardProps.jobIdToUnlock = pendingUnlockJobId;
      dashboardProps.onUnlockAndApply = handleUnlockAndApply;
    }


    switch (userProfile.role) {
      case UserRole.Admin:
        return <AdminDashboard {...dashboardProps} />;
      case UserRole.Recommender:
        return <RecommenderDashboard {...dashboardProps} />;
      case UserRole.Seeker:
        return <SeekerDashboard {...dashboardProps} />;
      case UserRole.Professional:
        return <ProfessionalDashboard {...dashboardProps} />;
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl text-center">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Error</h1>
              <p>Rol de usuario desconocido. Por favor, contacta a soporte.</p>
              <Button onClick={handleLogout} className="w-full mt-6">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col">
       <Navbar 
            user={user}
            userProfile={userProfile}
            // Use the name from the new route state
            currentView={route.name}
            onLoginClick={() => handleLoginRequest()} 
            onRegisterClick={() => handleRegisterRequest()} 
            onLogout={handleLogout}
            onNavigate={handleNavigation}
        />
        
      {/* Use the new route state to determine which view to render */}
      {route.name === 'dashboard' && user && userProfile ? (
        <main className="flex-grow p-4 md:p-6 lg:p-8">
          {renderDashboard()}
        </main>
      ) : (
        <>
          <main className="flex flex-col items-center justify-center flex-grow p-4 text-center">
             <div className="max-w-3xl mx-auto py-16 sm:py-24">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
                  Tu comunidad, tus recomendaciones.
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Conectamos a personas con información real y local. Encuentra ofertas de empleo, alquileres y servicios de confianza, todo a través de recomendaciones de gente como tú.
                </p>
                {!user && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button onClick={() => handleRegisterRequest()} className="w-full sm:w-auto">
                        Únete a la comunidad
                      </Button>
                      <Button onClick={() => handleLoginRequest()} variant="secondary" className="w-full sm:w-auto">
                        Iniciar Sesión
                      </Button>
                    </div>
                )}
              </div>
          </main>
          <ListingsSection 
            user={user} 
            userProfile={userProfile}
            onLoginRequest={handleLoginRequest} 
            onProfileUpdate={handleProfileUpdate}
            jobToAutoOpen={jobToAutoOpen}
            onAutoOpenDone={() => setJobToAutoOpen(null)}
            onStartOnboarding={handleStartOnboarding}
          />
          <TopMembersSection />
          <MembershipSection onRegisterClick={handleRegisterRequest} />
        </>
      )}

      {showLoginModal && <LoginModal onClose={closeAndResetModals} onSwitchToRegister={openRegister} />}
      {showRegisterModal && <RegisterModal onClose={closeAndResetModals} onSwitchToLogin={openLogin} forceSeekerRole={lockRoleToSeeker} defaultRole={defaultRole} />}
    </div>
  );
};

export default App;
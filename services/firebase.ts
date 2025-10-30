// Fix: Use Firebase v8 compat imports to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { UserRole, type UserProfile, type Notification, type MembershipPlanDetails, type ProfessionalListing, type Listing, type JobListing, type AppConfig } from '../types';

// IMPORTANT: Replace with your own Firebase project configuration
const firebaseConfig = {
   apiKey: "AIzaSyDsCNY5_M355lbDX9VWE-fPOcTboaQ8uBI",
  authDomain: "terecomiendo-59657.firebaseapp.com",
  databaseURL: "https://terecomiendo-59657-default-rtdb.firebaseio.com",
  projectId: "terecomiendo-59657",
  storageBucket: "gs://terecomiendo-59657.firebasestorage.app",
  messagingSenderId: "688346631365",
  appId: "1:688346631365:web:aee4aa3b2a193144fd34ac",
  measurementId: "G-W4R0G3R4R5"
};

// Seed initial data if the collection doesn't exist
const seedMembershipPlans = async (db: firebase.firestore.Firestore) => {
  const plansCollection = db.collection('membershipPlans');
  const snapshot = await plansCollection.limit(1).get();

  if (snapshot.empty) {
    console.log('Seeding initial membership plans...');
    const batch = db.batch();

    const seekerPlan = {
      name: 'Plan Buscador',
      price: 0,
      description: 'Ideal para quienes buscan oportunidades y servicios.',
      features: ['Acceso a todas las recomendaciones', 'Contacto directo con recomendadores', 'Guardar búsquedas favoritas', 'Soporte por correo electrónico'],
    };
    batch.set(plansCollection.doc('seeker'), seekerPlan);

    const recommenderPlan = {
      name: 'Plan Recomendador',
      price: 5,
      description: 'Perfecto para quienes quieren compartir y ganar.',
      features: ['Publicar recomendaciones ilimitadas', 'Recibir bonificaciones por éxito', 'Perfil destacado en la comunidad', 'Estadísticas de tus publicaciones'],
    };
    batch.set(plansCollection.doc('recommender'), recommenderPlan);
    
    const professionalPlan = {
        name: 'Plan Profesional',
        price: 15,
        description: 'La mejor opción para profesionales y negocios.',
        features: ['Perfil profesional público', 'Recibir recomendaciones directas', 'Acceso a analytics avanzados', 'Soporte prioritario 24/7'],
    };
    batch.set(plansCollection.doc('professional'), professionalPlan);

    await batch.commit();
    console.log('Membership plans seeded successfully.');
  }
};

const seedAppConfig = async (db: firebase.firestore.Firestore) => {
    const configRef = db.collection('appConfig').doc('settings');
    const doc = await configRef.get();
    if (!doc.exists) {
        console.log('Seeding initial app configuration...');
        await configRef.set({
            unlockFee: 5,
        });
        console.log('App config seeded successfully.');
    }
};


const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

seedMembershipPlans(db);
seedAppConfig(db);


// Fix: Define and export User and AuthError types from the v8 compat library.
export type User = firebase.User;
export type AuthError = firebase.auth.AuthError;

// Create a notification
export const createNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<void> => {
  await db.collection('notifications').add({
    ...notification,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    read: false,
  });
};


// Registration function
export const registerUser = async (email: string, password: string, role: UserRole): Promise<User> => {
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;
  if (!user) {
    throw new Error('User creation failed');
  }

  const getPlanIdForRole = (r: UserRole): string => {
    switch(r) {
        case UserRole.Seeker: return 'seeker';
        case UserRole.Recommender: return 'recommender';
        case UserRole.Professional: return 'professional';
        default: return 'seeker';
    }
  }

  // Create user profile in Firestore
  const userProfile: Omit<UserProfile, 'uid' | 'email' | 'role'> & {
    uid: string;
    email: string;
    role: UserRole;
  } = {
    uid: user.uid,
    email: user.email,
    role: role,
    fullName: '',
    address: '',
    postalCode: '',
    phoneNumber: '',
    isActive: true,
    unlockedListings: [],
    membership: {
        planId: getPlanIdForRole(role),
        status: 'active',
        expiresAt: null, // Default to non-expiring
    },
  };

  if (role === UserRole.Recommender) {
    userProfile.trialStartedAt = firebase.firestore.FieldValue.serverTimestamp();
    userProfile.postsMade = 0;
    userProfile.totalRatingPoints = 0;
    userProfile.ratingCount = 0;
  }

  if (role === UserRole.Professional) {
    userProfile.listingTrialStartedAt = firebase.firestore.FieldValue.serverTimestamp();
    userProfile.listingsMade = 0;
    userProfile.isVerified = false;
  }

  await db.collection('users').doc(user.uid).set(userProfile);

  await createNotification({
    type: 'NEW_USER',
    message: `El usuario ${email} se ha registrado como ${role}.`,
    relatedUserId: user.uid,
  });

  return user;
};

// Login function
export const loginUser = async (email: string, password: string): Promise<User> => {
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  const user = userCredential.user;
  if (!user) {
    throw new Error('Login failed');
  }

  const profile = await getUserProfile(user.uid);
  if (profile && profile.isActive === false) {
    await auth.signOut();
    throw new Error('Tu cuenta ha sido desactivada por un administrador.');
  }

  return user;
};

// Logout function
export const logoutUser = async (): Promise<void> => {
  await auth.signOut();
};

// Auth state change observer
export const onAuthChange = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = db.collection('users').doc(uid);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    return docSnap.data() as UserProfile;
  } else {
    console.log("No such document!");
    return null;
  }
};

// Get all user profiles from Firestore
export const getAllUsers = async (): Promise<UserProfile[]> => {
  const snapshot = await db.collection('users').get();
  const users: UserProfile[] = [];
  snapshot.forEach((doc) => {
    users.push(doc.data() as UserProfile);
  });
  return users;
};


// Update user profile
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  await db.collection('users').doc(uid).update(data);
};

// Delete a user's profile document from Firestore
export const deleteUserProfile = async (uid: string): Promise<void> => {
  await db.collection('users').doc(uid).delete();
  // Note: This does not delete the user from Firebase Authentication.
  // A Cloud Function would be required for that to be done securely.
};

// Upload avatar image
export const uploadAvatar = (
  uid: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileRef = storage.ref(`avatars/${uid}/${file.name}`);
    const uploadTask = fileRef.put(file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      () => {
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
};

// Upload resume/CV
export const uploadResume = (
  jobId: string,
  userId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileRef = storage.ref(`resumes/${jobId}/${userId}/${file.name}`);
    const uploadTask = fileRef.put(file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      () => {
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
};


// Upload payment receipt
export const uploadPaymentReceipt = (
  uid: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileRef = storage.ref(`payment_receipts/${uid}/${Date.now()}_${file.name}`);
    const uploadTask = fileRef.put(file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      () => {
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
};


// --- APP CONFIG FUNCTIONS ---

export const getAppConfig = async (): Promise<AppConfig> => {
    const docRef = db.collection('appConfig').doc('settings');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return docSnap.data() as AppConfig;
    } else {
        // Return default config if it doesn't exist
        return { unlockFee: 5 };
    }
};

export const updateAppConfig = async (data: Partial<AppConfig>): Promise<void> => {
    await db.collection('appConfig').doc('settings').set(data, { merge: true });
};


// --- MEMBERSHIP PLAN FUNCTIONS ---

// Get all membership plans from Firestore
export const getMembershipPlans = async (): Promise<MembershipPlanDetails[]> => {
    const snapshot = await db.collection('membershipPlans').orderBy('price', 'asc').get();
    const plans: MembershipPlanDetails[] = [];
    snapshot.forEach((doc) => {
        plans.push({ id: doc.id, ...doc.data() } as MembershipPlanDetails);
    });
    return plans;
}

// Update a membership plan
export const updateMembershipPlan = async (planId: string, data: Partial<Omit<MembershipPlanDetails, 'id'>>) => {
    await db.collection('membershipPlans').doc(planId).update(data);
}


// --- NOTIFICATION FUNCTIONS ---

// Real-time listener for notifications
export const onNotificationsChange = (userProfile: UserProfile, callback: (notifications: Notification[]) => void) => {
  let query: firebase.firestore.Query = db.collection('notifications');

  if (userProfile.role !== UserRole.Admin) {
    // Non-admins only see notifications targeted to them
    query = query.where('targetUid', '==', userProfile.uid);
  }
  
  return query.orderBy('timestamp', 'desc').limit(50)
    .onSnapshot(snapshot => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Notification));
      callback(notifications);
    });
};

// Mark a single notification as read
export const markNotificationAsRead = async (id: string): Promise<void> => {
  await db.collection('notifications').doc(id).update({ read: true });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
    const snapshot = await db.collection('notifications').where('read', '==', false).get();
    
    if (snapshot.empty) {
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });

    await batch.commit();
};

// --- COMBINED LISTING FUNCTIONS ---

// Get all verified listings (both types) for the public
export const getListings = async (): Promise<Listing[]> => {
  const profQuery = db.collection('professionalListings').where('status', '==', 'verified');
  const jobQuery = db.collection('jobListings').where('status', '==', 'verified');
  
  const [profSnapshot, jobSnapshot] = await Promise.all([profQuery.get(), jobQuery.get()]);
  
  const listings: Listing[] = [];
  profSnapshot.forEach((doc) => {
    listings.push({ id: doc.id, ...doc.data(), listingType: 'professional' } as ProfessionalListing);
  });
  jobSnapshot.forEach((doc) => {
    listings.push({ id: doc.id, ...doc.data(), listingType: 'job' } as JobListing);
  });

  listings.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return listings;
};

// Get all listings (both types) for an Admin
export const getAllListings = async (): Promise<Listing[]> => {
  const profSnapshotPromise = db.collection('professionalListings').get();
  const jobSnapshotPromise = db.collection('jobListings').get();
  
  const [profSnapshot, jobSnapshot] = await Promise.all([profSnapshotPromise, jobSnapshotPromise]);
  
  const listings: Listing[] = [];
  profSnapshot.forEach((doc) => {
    listings.push({ id: doc.id, ...doc.data(), listingType: 'professional' } as ProfessionalListing);
  });
  jobSnapshot.forEach((doc) => {
    listings.push({ id: doc.id, ...doc.data(), listingType: 'job' } as JobListing);
  });

  listings.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return listings;
};

// --- PROFESSIONAL LISTING FUNCTIONS ---

// Upload listing image
export const uploadListingImage = (
  uid: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileRef = storage.ref(`listing_images/${uid}/${Date.now()}_${file.name}`);
    const uploadTask = fileRef.put(file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      () => {
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
};

// Create a new professional listing
export const createListing = async (listingData: Omit<ProfessionalListing, 'id' | 'createdAt' | 'status' | 'listingType'>): Promise<void> => {
  await db.collection('professionalListings').add({
    ...listingData,
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

// Get listings for a specific professional
export const getListingsByProfessional = async (professionalId: string): Promise<ProfessionalListing[]> => {
  const snapshot = await db.collection('professionalListings')
    .where('professionalId', '==', professionalId)
    .get();
    
  const listings: ProfessionalListing[] = [];
  snapshot.forEach((doc) => {
    listings.push({ id: doc.id, ...doc.data() } as ProfessionalListing);
  });
  
  listings.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return listings;
};

// Update a professional listing
export const updateListing = async (listingId: string, data: Partial<ProfessionalListing>): Promise<void> => {
  await db.collection('professionalListings').doc(listingId).update(data);
};

// Delete a professional listing
export const deleteListing = async (listingId: string): Promise<void> => {
  await db.collection('professionalListings').doc(listingId).delete();
};


// --- JOB LISTING FUNCTIONS ---

// Create a new job listing
export const createJobListing = async (listingData: Omit<JobListing, 'id' | 'createdAt' | 'status' | 'listingType'>): Promise<void> => {
  const recommenderProfile = await getUserProfile(listingData.recommenderId);
  let currentRating = 0;
  if (recommenderProfile && recommenderProfile.ratingCount && recommenderProfile.ratingCount > 0) {
    currentRating = (recommenderProfile.totalRatingPoints || 0) / recommenderProfile.ratingCount;
  }
  
  const dummySuccessfulRecommendations = {
      successfulRecommendations: Math.floor(Math.random() * 50) + 5, // 5 to 55
  };
  
  await db.collection('jobListings').add({
    ...listingData,
    recommenderRating: currentRating,
    successfulRecommendations: recommenderProfile?.successfulRecommendations || dummySuccessfulRecommendations.successfulRecommendations,
    status: 'pending',
    ratedBy: [], // Initialize ratedBy array
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

// Get listings for a specific recommender
export const getJobListingsByRecommender = async (recommenderId: string): Promise<JobListing[]> => {
  const snapshot = await db.collection('jobListings')
    .where('recommenderId', '==', recommenderId)
    .get();
    
  const listings: JobListing[] = [];
  snapshot.forEach((doc) => {
    listings.push({ id: doc.id, ...doc.data() } as JobListing);
  });
  
  listings.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return listings;
};

// Get job listings a user has applied to
export const getAppliedJobsForSeeker = async (seekerId: string): Promise<JobListing[]> => {
  const snapshot = await db.collection('jobListings')
    .where('applicants', 'array-contains', seekerId)
    .get();
    
  const listings: JobListing[] = [];
  snapshot.forEach((doc) => {
    listings.push({ id: doc.id, ...doc.data() } as JobListing);
  });
  
  listings.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return listings;
};


// Update a job listing
export const updateJobListing = async (listingId: string, data: Partial<JobListing>): Promise<void> => {
  await db.collection('jobListings').doc(listingId).update(data);
};

// Delete a job listing
export const deleteJobListing = async (listingId: string): Promise<void> => {
  await db.collection('jobListings').doc(listingId).delete();
};

// Apply to a job listing
export const applyToJobListing = async (jobId: string, applicantProfile: UserProfile, resumeUrl: string): Promise<Partial<JobListing>> => {
  const jobRef = db.collection('jobListings').doc(jobId);
  const userId = applicantProfile.uid;
  let updatedFields: Partial<JobListing> = {};
  let jobDataForNotification: JobListing | null = null;

  await db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      throw new Error("La oferta de empleo ya no existe.");
    }

    const jobData = jobDoc.data() as JobListing;
    jobDataForNotification = jobData;

    if ((jobData.applicantCount || 0) >= 20) {
      throw new Error("Lo sentimos, ya no hay vacantes disponibles para esta oferta.");
    }
    if (jobData.applicants?.includes(userId)) {
      throw new Error("Ya te has postulado a esta oferta.");
    }
    
    const newApplicantCount = (jobData.applicantCount || 0) + 1;
    
    const newStatus = {
        status: 'applied' as const,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        resumeUrl: resumeUrl
    };

    const updates: { [key: string]: any } = {
        applicants: firebase.firestore.FieldValue.arrayUnion(userId),
        applicantCount: firebase.firestore.FieldValue.increment(1),
        [`applicantStatuses.${userId}`]: newStatus,
    };
    
    updatedFields = {
        applicantCount: newApplicantCount,
        applicants: [...(jobData.applicants || []), userId],
        applicantStatuses: {
            ...jobData.applicantStatuses,
            [userId]: newStatus,
        }
    };

    if (newApplicantCount >= 20) {
        updates.status = 'follow-up';
        updatedFields.status = 'follow-up';
    }

    transaction.update(jobRef, updates);
  });

  if (updatedFields.status === 'follow-up' && jobDataForNotification) {
      await createNotification({
          type: 'LISTING_FULL',
          message: `La oferta de empleo "${jobDataForNotification.jobTitle}" ha avanzado a la siguiente etapa.`,
      });
  }
  
  if (jobDataForNotification) {
      const applicantName = applicantProfile.fullName || applicantProfile.email;
      await createNotification({
          type: 'NEW_APPLICATION',
          message: `¡Buenas noticias! ${applicantName} se ha postulado a tu recomendación "${jobDataForNotification.jobTitle}".`,
          targetUid: jobDataForNotification.recommenderId,
          relatedUserId: userId,
      });
  }


  return updatedFields;
};

// Unlock a job listing for a user
export const unlockJobListing = async (userId: string, jobId: string): Promise<void> => {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
        unlockedListings: firebase.firestore.FieldValue.arrayUnion(jobId)
    });
};

// Submit a rating for a recommender
export const submitRating = async (jobId: string, seekerId: string, recommenderId: string, ratingValue: number): Promise<void> => {
    const jobRef = db.collection('jobListings').doc(jobId);
    const recommenderRef = db.collection('users').doc(recommenderId);

    return db.runTransaction(async (transaction) => {
        const recommenderDoc = await transaction.get(recommenderRef);
        if (!recommenderDoc.exists) {
            throw new Error("El perfil del recomendador no fue encontrado.");
        }

        // Update job listing to mark as rated
        transaction.update(jobRef, {
            ratedBy: firebase.firestore.FieldValue.arrayUnion(seekerId)
        });

        // Update recommender's rating stats
        transaction.update(recommenderRef, {
            totalRatingPoints: firebase.firestore.FieldValue.increment(ratingValue),
            ratingCount: firebase.firestore.FieldValue.increment(1)
        });
    });
};
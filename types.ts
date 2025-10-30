export enum UserRole {
  Recommender = 'Recomendador',
  Seeker = 'Buscador',
  Professional = 'Profesional',
  Admin = 'Administrador',
}

export interface MembershipPlanDetails {
    id: string; // 'seeker', 'recommender', 'professional'
    name: string;
    price: number;
    description: string;
    features: string[];
}

export interface AppConfig {
    unlockFee: number;
}

export interface Membership {
    planId: string;
    status: 'active' | 'inactive' | 'expired' | 'pending_verification';
    expiresAt: any | null; // Firestore Timestamp or null for non-expiring
    paymentReceiptUrl?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  avatarUrl?: string;
  fullName?: string;
  address?: string;
  postalCode?: string;
  phoneNumber?: string;
  membership?: Membership;
  unlockedListings?: string[]; // Array of JobListing IDs
  // Trial fields for Recommenders
  trialStartedAt?: any; // Firestore Timestamp
  postsMade?: number;
  // Trial fields for Professionals
  listingTrialStartedAt?: any; // Firestore Timestamp
  listingsMade?: number;
  isVerified?: boolean; // Admin can verify a professional
  // Rating fields for Recommenders
  totalRatingPoints?: number;
  ratingCount?: number;
  // Fix: Add missing property `successfulRecommendations` to UserProfile.
  successfulRecommendations?: number;
}

export interface Notification {
  id: string;
  type: 'NEW_USER' | 'USER_STATUS_CHANGE' | 'LISTING_FULL' | 'NEW_APPLICATION';
  message: string;
  timestamp: any; // Firestore Timestamp
  read: boolean;
  targetUid?: string;
  relatedUserId?: string;
}

export type ApplicationStatus = 'applied' | 'viewed' | 'shortlisted' | 'rejected';

export interface JobListing {
  id: string;
  listingType: 'job'; // To differentiate
  recommenderId: string;
  jobTitle: string; // Required
  jobDetails?: string; // Optional
  companyName?: string; // Optional
  salary?: { // Optional
    value: number;
    type: 'per_hour' | 'per_year';
  };
  address?: string; // Optional
  areaCode?: string; // Optional
  contactPhone: string; // Required
  contactEmail: string; // Required
  contactPerson: string; // Required
  createdAt: any; // Firestore Timestamp
  status: 'pending' | 'verified' | 'rejected' | 'follow-up';
  rejectionDetails?: {
    reasons: string[];
    details: string;
  } | null;
  // Denormalized data
  recommenderName: string;
  recommenderAvatarUrl?: string;
  recommenderRating?: number;
  successfulRecommendations?: number;
  // Application data
  applicants: string[]; // Array of user UIDs
  applicantCount: number;
  applicantStatuses?: {
    [uid: string]: {
      status: ApplicationStatus;
      updatedAt: any; // Firestore Timestamp
      resumeUrl?: string;
    };
  };
  ratedBy: string[]; // Array of seeker UIDs who have rated this
}


export interface ProfessionalListing {
  id: string;
  listingType: 'professional';
  professionalId: string;
  serviceTitle: string;
  serviceDetails: string;
  imageUrl?: string;
  priceType: 'per_hour' | 'per_job';
  price: number;
  availability: string;
  address: string;
  phoneNumber: string;
  createdAt: any; // Firestore Timestamp
  status: 'pending' | 'verified' | 'rejected';
  rejectionDetails?: {
    reasons: string[];
    details: string;
  } | null;
  // Denormalized data for card display
  professionalName: string;
  professionalAvatarUrl?: string;
  isProfessionalVerified?: boolean;
  // Data for the card
  rating: number;
  totalRatings: number;
  successfulJobs: number;
  solicitedJobs: number;
}

export type Listing = ProfessionalListing | JobListing;
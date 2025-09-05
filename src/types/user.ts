export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  company: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    emailNotifications: boolean;
    overdueReminders: boolean;
    paymentConfirmations: boolean;
  };
  invoiceDefaults: {
    taxRate: number;
    currency: string;
    paymentTerms: string;
    notes?: string;
  };
  preferences: {
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    numberFormat: 'US' | 'EU' | 'UK';
    autoSave: boolean;
  };
}

export interface UserData {
  profile: UserProfile;
  settings: UserSettings;
}

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  settings: UserSettings;
  lastLogin: string;
  isVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'system',
  notifications: {
    emailNotifications: true,
    overdueReminders: true,
    paymentConfirmations: true,
  },
  invoiceDefaults: {
    taxRate: 10,
    currency: 'USD',
    paymentTerms: 'Net 30',
    notes: 'Thank you for your business!',
  },
  preferences: {
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'US',
    autoSave: true,
  },
};

export const DEFAULT_USER_PROFILE: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  email: '',
  company: {
    name: '',
    address: '',
  },
};
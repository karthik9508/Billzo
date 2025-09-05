import { UserProfile, UserSettings, UserData, DEFAULT_USER_SETTINGS, DEFAULT_USER_PROFILE } from '@/types/user';

const USER_PROFILE_KEY = 'user_profile';
const USER_SETTINGS_KEY = 'user_settings';

export const userStorage = {
  // Profile management
  getProfile: (): UserProfile | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(USER_PROFILE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Error accessing profile storage:', error);
      return null;
    }
  },

  saveProfile: (profile: UserProfile): void => {
    if (typeof window === 'undefined') return;
    const updatedProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
  },

  createProfile: (profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): UserProfile => {
    const now = new Date().toISOString();
    const profile: UserProfile = {
      ...profileData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    userStorage.saveProfile(profile);
    return profile;
  },

  // Settings management
  getSettings: (): UserSettings => {
    if (typeof window === 'undefined') return DEFAULT_USER_SETTINGS;
    try {
      const stored = localStorage.getItem(USER_SETTINGS_KEY);
      return stored ? { ...DEFAULT_USER_SETTINGS, ...JSON.parse(stored) } : DEFAULT_USER_SETTINGS;
    } catch (error) {
      console.warn('Error accessing settings storage:', error);
      return DEFAULT_USER_SETTINGS;
    }
  },

  saveSettings: (settings: UserSettings): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  },

  updateSettings: (partialSettings: Partial<UserSettings>): UserSettings => {
    const currentSettings = userStorage.getSettings();
    const updatedSettings = {
      ...currentSettings,
      ...partialSettings,
      // Deep merge for nested objects
      notifications: {
        ...currentSettings.notifications,
        ...(partialSettings.notifications || {}),
      },
      invoiceDefaults: {
        ...currentSettings.invoiceDefaults,
        ...(partialSettings.invoiceDefaults || {}),
      },
      preferences: {
        ...currentSettings.preferences,
        ...(partialSettings.preferences || {}),
      },
    };
    userStorage.saveSettings(updatedSettings);
    return updatedSettings;
  },

  // Combined data management
  getAllUserData: (): UserData | null => {
    const profile = userStorage.getProfile();
    if (!profile) return null;
    
    const settings = userStorage.getSettings();
    return { profile, settings };
  },

  // Authentication simulation
  isLoggedIn: (): boolean => {
    return userStorage.getProfile() !== null;
  },

  // Data management
  exportUserData: (): string => {
    const userData = userStorage.getAllUserData();
    if (!userData) throw new Error('No user data found');
    return JSON.stringify(userData, null, 2);
  },

  importUserData: (jsonData: string): void => {
    try {
      const userData = JSON.parse(jsonData) as UserData;
      if (userData.profile) {
        userStorage.saveProfile(userData.profile);
      }
      if (userData.settings) {
        userStorage.saveSettings(userData.settings);
      }
    } catch (error) {
      throw new Error('Invalid user data format');
    }
  },

  clearAllData: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(USER_SETTINGS_KEY);
    
    // Also clear invoices and theme data
    localStorage.removeItem('invoices');
    localStorage.removeItem('theme');
  },

  // Initialize default profile if none exists
  initializeUser: (name?: string, email?: string): UserProfile => {
    const existingProfile = userStorage.getProfile();
    if (existingProfile) return existingProfile;

    const profile = userStorage.createProfile({
      ...DEFAULT_USER_PROFILE,
      name: name || 'User',
      email: email || '',
    });

    // Also initialize default settings
    userStorage.saveSettings(DEFAULT_USER_SETTINGS);
    
    return profile;
  },
};
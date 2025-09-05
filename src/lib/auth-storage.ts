import { AuthUser, LoginCredentials, SignupData, UserProfile, DEFAULT_USER_SETTINGS, DEFAULT_USER_PROFILE } from '@/types/user';

const AUTH_USERS_KEY = 'auth_users';
const CURRENT_SESSION_KEY = 'current_session';

// Simple hash function for password (in production, use bcrypt or similar)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_key_2024'); // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Verify password against hash
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
};

export const authStorage = {
  // Get all registered users
  getAllUsers: (): AuthUser[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(AUTH_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Save users array
  saveUsers: (users: AuthUser[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  },

  // Find user by email
  findUserByEmail: (email: string): AuthUser | null => {
    const users = authStorage.getAllUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  },

  // Register new user
  register: async (signupData: SignupData): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
    try {
      // Validate input
      if (!signupData.name.trim()) {
        return { success: false, message: 'Name is required' };
      }
      
      if (!signupData.email.trim()) {
        return { success: false, message: 'Email is required' };
      }
      
      if (!signupData.email.includes('@')) {
        return { success: false, message: 'Please enter a valid email address' };
      }
      
      if (signupData.password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }
      
      if (signupData.password !== signupData.confirmPassword) {
        return { success: false, message: 'Passwords do not match' };
      }

      // Check if user already exists
      const existingUser = authStorage.findUserByEmail(signupData.email);
      if (existingUser) {
        return { success: false, message: 'An account with this email already exists' };
      }

      // Create new user
      const now = new Date().toISOString();
      const userId = crypto.randomUUID();
      const passwordHash = await hashPassword(signupData.password);

      const newProfile: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        id: userId,
        name: signupData.name,
        email: signupData.email,
        createdAt: now,
        updatedAt: now,
      };

      const newUser: AuthUser = {
        id: userId,
        email: signupData.email,
        passwordHash,
        profile: newProfile,
        settings: DEFAULT_USER_SETTINGS,
        lastLogin: now,
        isVerified: true, // For simplicity, auto-verify
      };

      // Save user
      const users = authStorage.getAllUsers();
      users.push(newUser);
      authStorage.saveUsers(users);

      return { success: true, message: 'Account created successfully!', user: newUser };
    } catch (error) {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
    try {
      if (!credentials.email.trim()) {
        return { success: false, message: 'Email is required' };
      }
      
      if (!credentials.password.trim()) {
        return { success: false, message: 'Password is required' };
      }

      // Find user
      const user = authStorage.findUserByEmail(credentials.email);
      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Verify password
      const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);
      if (!isValidPassword) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Update last login
      const users = authStorage.getAllUsers();
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex >= 0) {
        users[userIndex].lastLogin = new Date().toISOString();
        authStorage.saveUsers(users);
      }

      return { success: true, message: 'Login successful!', user: users[userIndex] || user };
    } catch (error) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  },

  // Create session
  createSession: (user: AuthUser): void => {
    if (typeof window === 'undefined') return;
    
    const session = {
      userId: user.id,
      email: user.email,
      loginTime: new Date().toISOString(),
    };
    
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
    
    // Also set user data in the existing user storage format for compatibility
    localStorage.setItem('user_profile', JSON.stringify(user.profile));
    localStorage.setItem('user_settings', JSON.stringify(user.settings));
  },

  // Get current session
  getCurrentSession: () => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(CURRENT_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Check if user is logged in
  isLoggedIn: (): boolean => {
    const session = authStorage.getCurrentSession();
    return session !== null;
  },

  // Get current user
  getCurrentUser: (): AuthUser | null => {
    const session = authStorage.getCurrentSession();
    if (!session) return null;
    
    return authStorage.findUserByEmail(session.email);
  },

  // Logout
  logout: (): void => {
    if (typeof window === 'undefined') return;
    
    // Clear session
    localStorage.removeItem(CURRENT_SESSION_KEY);
    
    // Clear user data
    localStorage.removeItem('user_profile');
    localStorage.removeItem('user_settings');
    localStorage.removeItem('theme');
    localStorage.removeItem('invoices');
  },

  // Update user profile
  updateUserProfile: (updatedProfile: UserProfile): boolean => {
    try {
      const users = authStorage.getAllUsers();
      const userIndex = users.findIndex(u => u.id === updatedProfile.id);
      
      if (userIndex >= 0) {
        users[userIndex].profile = updatedProfile;
        authStorage.saveUsers(users);
        
        // Update local storage for compatibility
        localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
        
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  },

  // Change password
  changePassword: async (email: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters' };
      }

      const user = authStorage.findUserByEmail(email);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Update password
      const newPasswordHash = await hashPassword(newPassword);
      const users = authStorage.getAllUsers();
      const userIndex = users.findIndex(u => u.id === user.id);
      
      if (userIndex >= 0) {
        users[userIndex].passwordHash = newPasswordHash;
        authStorage.saveUsers(users);
        return { success: true, message: 'Password updated successfully!' };
      }

      return { success: false, message: 'Failed to update password' };
    } catch (error) {
      return { success: false, message: 'Password change failed. Please try again.' };
    }
  },

  // Delete account
  deleteAccount: (email: string): boolean => {
    try {
      const users = authStorage.getAllUsers();
      const filteredUsers = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
      
      if (filteredUsers.length < users.length) {
        authStorage.saveUsers(filteredUsers);
        authStorage.logout();
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  },
};
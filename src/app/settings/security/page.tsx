'use client';

import { useState, useEffect } from 'react';
import { authStorage } from '@/lib/auth-storage';
import { userStorage } from '@/lib/user-storage';
import { UserProfile } from '@/types/user';

export default function SecuritySettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadProfile = () => {
      const userProfile = userStorage.getProfile();
      setProfile(userProfile);
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Validate passwords
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      const result = await authStorage.changePassword(
        profile.email,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowChangePassword(false);
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="card rounded-lg shadow p-8">
        <div className="animate-pulse text-center">
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Loading security settings...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Password Security */}
      <div className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Password Security</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your account password</p>
        </div>
        <div className="p-6">
          {!showChangePassword ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Current Password</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Password was last updated on {profile ? new Date(profile.updatedAt).toLocaleDateString() : 'unknown'}
                </p>
              </div>
              <button
                onClick={() => setShowChangePassword(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Change Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Enter new password"
                />
                {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Confirm new password"
                />
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setMessage(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Security Tips */}
      <div className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Security Best Practices</h2>
          <p className="text-gray-600 dark:text-gray-400">Keep your account secure</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Use a Strong Password</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use at least 8 characters with a mix of letters, numbers, and symbols.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 text-xs">🔒</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Keep Your Data Safe</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Regularly export your invoice data as backups.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 dark:text-orange-400 text-xs">⚡</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Stay Updated</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Update your password regularly and keep your browser up to date.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 dark:text-purple-400 text-xs">🚪</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Secure Logout</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Always log out when using shared or public computers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account Status</h2>
          <p className="text-gray-600 dark:text-gray-400">Your account security information</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Account Status</h4>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Active & Verified</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Last Login</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {profile ? new Date(profile.updatedAt).toLocaleString() : 'Unknown'}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Account Created</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {profile ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Data Storage</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Local Browser Storage (Secure)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
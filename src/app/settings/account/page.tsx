'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userStorage } from '@/lib/user-storage';
import { invoiceStorage } from '@/lib/invoice-storage';
import { authStorage } from '@/lib/auth-storage';
import { UserProfile } from '@/types/user';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const loadProfile = () => {
      const userProfile = userStorage.getProfile();
      setProfile(userProfile);
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleExportData = () => {
    try {
      // Export user data
      const userData = userStorage.exportUserData();
      
      // Get all invoices
      const invoices = invoiceStorage.getAll();
      
      const fullExport = {
        userData: JSON.parse(userData),
        invoices,
        exportDate: new Date().toISOString(),
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-maker-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data exported successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data. Please try again.' });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Import user data if available
        if (data.userData) {
          userStorage.importUserData(JSON.stringify(data.userData));
        }
        
        // Import invoices if available
        if (data.invoices && Array.isArray(data.invoices)) {
          data.invoices.forEach((invoice: any) => {
            invoiceStorage.save(invoice);
          });
        }

        setMessage({ type: 'success', text: 'Data imported successfully! Please refresh the page.' });
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid file format. Please select a valid export file.' });
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = () => {
    // Use auth storage logout for proper session cleanup
    authStorage.logout();
    
    setMessage({ type: 'success', text: 'Logged out successfully!' });
    setTimeout(() => {
      router.push('/auth/login');
      window.location.reload();
    }, 1000);
  };

  const handleDeleteAccount = () => {
    if (!profile) return;
    
    // Delete from auth system
    const deleted = authStorage.deleteAccount(profile.email);
    
    if (deleted) {
      setMessage({ type: 'success', text: 'Account deleted successfully!' });
      setTimeout(() => {
        router.push('/auth/login');
        window.location.reload();
      }, 1000);
    } else {
      setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="card rounded-lg shadow p-8">
        <div className="animate-pulse text-center">
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Loading account settings...</h2>
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

      {/* Account Information */}
      <div className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account Information</h2>
          <p className="text-gray-600 dark:text-gray-400">View your account details</p>
        </div>
        <div className="p-6">
          {profile ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{profile.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Created</label>
                  <p className="text-gray-900 dark:text-gray-100">{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                  <p className="text-gray-900 dark:text-gray-100">{new Date(profile.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No account information available.</p>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Data Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Export, import, or manage your data</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Export Data</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Download all your data as a JSON file</p>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              📥 Export
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Import Data</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload a previously exported data file</p>
            </div>
            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
              >
                📤 Import
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Security Actions */}
      <div className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Security & Privacy</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your account security</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Logout</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sign out and clear your session data</p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              🚪 Logout
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-red-600 dark:text-red-400">Delete Account</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              🗑️ Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Confirm Logout</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to logout? You will need to set up your profile again next time.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowLogoutConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">⚠️ Delete Account</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This will permanently delete your account, profile, settings, and all invoices. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteAccount();
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
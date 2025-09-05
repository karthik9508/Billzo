'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { userStorage } from '@/lib/user-storage';
import { authStorage } from '@/lib/auth-storage';
import { UserProfile } from '@/types/user';

export default function UserAvatar() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProfile = () => {
      let userProfile = userStorage.getProfile();
      
      if (!userProfile) {
        userProfile = userStorage.initializeUser();
      }
      
      setProfile(userProfile);
    };

    loadProfile();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authStorage.logout();
    setShowLogoutConfirm(false);
    router.push('/auth/login');
    window.location.reload();
  };

  if (!profile) {
    return (
      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
    );
  }

  const avatarInitial = profile.name.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold hover:shadow-lg transition-shadow"
        title={`${profile.name} - Click for menu`}
      >
        {avatarInitial}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          {/* Profile Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {avatarInitial}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {profile.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {profile.email}
                </p>
                {profile.company.name && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                    {profile.company.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/settings/profile"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="mr-3">👤</span>
              Edit Profile
            </Link>
            
            <Link
              href="/settings/preferences"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="mr-3">🔧</span>
              Preferences
            </Link>
            
            <Link
              href="/settings"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="mr-3">⚙️</span>
              All Settings
            </Link>
            
            <hr className="my-2 border-gray-200 dark:border-gray-700" />
            
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="mr-3">🚪</span>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Confirm Logout
              </h3>
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
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
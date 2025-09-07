'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { userStorage } from '@/lib/user-storage';
import { UserProfile, UserSettings } from '@/types/user';

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Initialize profile immediately on render
    const userProfile = userStorage.getProfile();
    return userProfile || userStorage.initializeUser();
  });
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Initialize settings immediately on render  
    return userStorage.getSettings();
  });

  // No loading state needed since localStorage access is synchronous

  const quickActions = [
    {
      title: 'Profile Settings',
      description: 'Update your personal and company information',
      href: '/settings/profile',
      icon: '👤',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    },
    {
      title: 'Preferences',
      description: 'Customize your invoice defaults and app behavior',
      href: '/settings/preferences',
      icon: '🔧',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300',
    },
    {
      title: 'Account Settings',
      description: 'Manage your account security and data',
      href: '/settings/account',
      icon: '🔐',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Welcome, {profile?.name || 'User'}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
            {profile?.company?.name && (
              <p className="text-sm text-gray-500 dark:text-gray-500">{profile.company.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="card rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <span className="text-xl">{action.icon}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Current Settings Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Settings</h3>
        <div className="card rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Theme</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {settings?.theme || 'System'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Default Tax Rate</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {settings?.invoiceDefaults.taxRate}%
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Currency</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {settings?.invoiceDefaults.currency}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Payment Terms</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {settings?.invoiceDefaults.paymentTerms}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
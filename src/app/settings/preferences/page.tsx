'use client';

import { useState, useEffect } from 'react';
import { userStorage } from '@/lib/user-storage';
import { UserSettings } from '@/types/user';
import { getAllCurrencies } from '@/lib/currency-utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeMode } from '@/lib/theme-utils';

export default function PreferencesPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const { setTheme: setGlobalTheme } = useTheme();

  useEffect(() => {
    const loadSettings = () => {
      const userSettings = userStorage.getSettings();
      setSettings(userSettings);
      setLoading(false);
    };

    loadSettings();
  }, []);

  const handleSettingChange = (section: keyof UserSettings, field: string, value: any) => {
    if (!settings) return;

    const currentSection = settings[section];
    if (typeof currentSection !== 'object' || currentSection === null) return;

    const updatedSettings = {
      ...settings,
      [section]: {
        ...currentSection,
        [field]: value,
      },
    };

    setSettings(updatedSettings);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      userStorage.saveSettings(settings);
      
      // Apply theme change immediately using centralized system
      setGlobalTheme(settings.theme);

      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card rounded-lg shadow p-8">
        <div className="animate-pulse text-center">
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Loading preferences...</h2>
        </div>
      </div>
    );
  }

  if (!settings) return null;

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

      {/* Theme Settings */}
      <div className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Theme Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">Choose your preferred appearance</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {['light', 'dark', 'system'].map((theme) => (
              <label key={theme} className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value={theme}
                  checked={settings.theme === theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as ThemeMode })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {theme} Theme
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {theme === 'system' && 'Match your system preference'}
                    {theme === 'light' && 'Light background with dark text'}
                    {theme === 'dark' && 'Dark background with light text'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Defaults */}
      <div className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Invoice Defaults</h2>
          <p className="text-gray-600 dark:text-gray-400">Set default values for new invoices</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.invoiceDefaults.taxRate}
                onChange={(e) => handleSettingChange('invoiceDefaults', 'taxRate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={settings.invoiceDefaults.currency}
                onChange={(e) => handleSettingChange('invoiceDefaults', 'currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {getAllCurrencies().map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Payment Terms
            </label>
            <select
              value={settings.invoiceDefaults.paymentTerms}
              onChange={(e) => handleSettingChange('invoiceDefaults', 'paymentTerms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="Due on receipt">Due on receipt</option>
              <option value="Net 7">Net 7 days</option>
              <option value="Net 15">Net 15 days</option>
              <option value="Net 30">Net 30 days</option>
              <option value="Net 60">Net 60 days</option>
              <option value="Net 90">Net 90 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Notes
            </label>
            <textarea
              value={settings.invoiceDefaults.notes || ''}
              onChange={(e) => handleSettingChange('invoiceDefaults', 'notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Default notes to include on invoices"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400">Choose what notifications you'd like to receive</p>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.emailNotifications}
              onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
              className="mr-3"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Receive email updates about your invoices</div>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.overdueReminders}
              onChange={(e) => handleSettingChange('notifications', 'overdueReminders', e.target.checked)}
              className="mr-3"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Overdue Reminders</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Get notified when invoices become overdue</div>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.paymentConfirmations}
              onChange={(e) => handleSettingChange('notifications', 'paymentConfirmations', e.target.checked)}
              className="mr-3"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Payment Confirmations</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Receive confirmation when invoices are marked as paid</div>
            </div>
          </label>
        </div>
      </div>

      {/* General Preferences */}
      <div className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">General Preferences</h2>
          <p className="text-gray-600 dark:text-gray-400">Customize your app experience</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Format
              </label>
              <select
                value={settings.preferences.dateFormat}
                onChange={(e) => handleSettingChange('preferences', 'dateFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number Format
              </label>
              <select
                value={settings.preferences.numberFormat}
                onChange={(e) => handleSettingChange('preferences', 'numberFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="US">US (1,234.56)</option>
                <option value="EU">EU (1.234,56)</option>
                <option value="UK">UK (1,234.56)</option>
              </select>
            </div>
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.preferences.autoSave}
              onChange={(e) => handleSettingChange('preferences', 'autoSave', e.target.checked)}
              className="mr-3"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Auto-save</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Automatically save changes as you type</div>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
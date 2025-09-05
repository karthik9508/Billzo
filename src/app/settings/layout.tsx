'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const settingsNav = [
  { name: 'Overview', href: '/settings', icon: '📋' },
  { name: 'Profile', href: '/settings/profile', icon: '👤' },
  { name: 'Preferences', href: '/settings/preferences', icon: '🔧' },
  { name: 'Security', href: '/settings/security', icon: '🔐' },
  { name: 'Account', href: '/settings/account', icon: '🗂️' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
          </div>

          <div className="flex space-x-8">
            {/* Settings Navigation */}
            <div className="w-64 flex-shrink-0">
              <nav className="card rounded-lg shadow p-4">
                <div className="space-y-2">
                  {settingsNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
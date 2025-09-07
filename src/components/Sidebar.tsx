'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserAvatar from './UserAvatar';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Invoices', href: '/invoices', icon: '📄' },
  { name: 'Create Invoice', href: '/invoices/new', icon: '➕' },
  { name: 'Customer Statements', href: '/customer-statements', icon: '📋' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="card shadow-sm w-64 min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Billzo</h1>
          <UserAvatar />
        </div>
      </div>
      
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#1E3A8A]/10 dark:bg-[#1E3A8A]/30 text-[#1E3A8A] dark:text-[#60A5FA]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
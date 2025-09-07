'use client';

import { useEffect, useState } from 'react';
import { invoiceStorage } from '@/lib/invoice-storage';
import { DashboardStats } from '@/types/invoice';
import { formatInvoiceAmount, CurrencyCode, getUserCurrency } from '@/lib/currency-utils';

export default function DashboardStatsComponent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueInvoices: 0,
  });

  // Get currency from user settings
  const currency = getUserCurrency();

  useEffect(() => {
    const invoices = invoiceStorage.getAll();
    
    const calculatedStats = invoices.reduce(
      (acc, invoice) => {
        acc.totalInvoices += 1;
        
        if (invoice.status === 'paid') {
          acc.paidAmount += invoice.total;
        } else if (invoice.status === 'overdue') {
          acc.overdueInvoices += 1;
          acc.pendingAmount += invoice.total;
        } else {
          acc.pendingAmount += invoice.total;
        }
        
        return acc;
      },
      {
        totalInvoices: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueInvoices: 0,
      }
    );
    
    setStats(calculatedStats);
  }, []);

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: '📄',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    },
    {
      title: 'Pending Amount',
      value: formatInvoiceAmount(stats.pendingAmount, currency),
      icon: '⏳',
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    },
    {
      title: 'Paid Amount',
      value: formatInvoiceAmount(stats.paidAmount, currency),
      icon: '✅',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    },
    {
      title: 'Overdue Invoices',
      value: stats.overdueInvoices,
      icon: '🚨',
      color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <div key={index} className="card p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
            </div>
            <div className={`p-3 rounded-full ${card.color}`}>
              <span className="text-xl">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
'use client';

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboard } from '@/hooks/useInvoices'
import { formatCurrency } from '@/lib/currency-utils'
import { Button } from '@/components/ui/Button'

export default function DashboardPage() {
  const { user, profile, settings } = useAuth()
  const { invoices: recentInvoices, stats, loading } = useDashboard()

  const currency = settings?.invoiceDefaults?.currency || 'USD'

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access your dashboard
          </p>
          <Button asChild>
            <Link href="/auth/login">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {profile?.name || user.email}
              </p>
            </div>
            <div className="flex space-x-4">
              <Button asChild>
                <Link href="/invoices/new">
                  Create Invoice
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/settings">
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Invoices
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {loading ? '...' : stats.totalInvoices}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pending Amount
            </h3>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
              {loading ? '...' : formatCurrency(stats.pendingAmount, currency)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Paid Amount
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {loading ? '...' : formatCurrency(stats.paidAmount, currency)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Overdue Invoices
            </h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
              {loading ? '...' : stats.overdueInvoices}
            </p>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Invoices
              </h2>
              <Link
                href="/invoices"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                Loading invoices...
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="mb-4">No invoices yet</p>
                <Button asChild>
                  <Link href="/invoices/new">
                    Create your first invoice
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.client.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(invoice.total, currency)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : invoice.status === 'sent'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {invoice.status}
                      </span>
                      
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

    </div>
  )
}

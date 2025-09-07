'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers, useCustomerStatements } from '@/hooks/useCustomerStatements';
import { formatCurrency, CurrencyCode, isSupportedCurrency } from '@/lib/currency-utils';
import { Button } from '@/components/ui/Button';
import { CustomerStatement } from '@/types/customer-statements';

export default function CustomerStatementsPage() {
  const { user, settings } = useAuth();
  const { customers, loading: customersLoading } = useCustomers();
  const { statements, loading: statementsLoading } = useCustomerStatements();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'sent'>('all');

  const rawCurrency = settings?.invoiceDefaults?.currency || 'INR';
  const currency: CurrencyCode = isSupportedCurrency(rawCurrency) ? rawCurrency : 'INR';

  // Filter statements based on selected filters
  const filteredStatements = statements.filter(statement => {
    if (selectedCustomerId && statement.customerId !== selectedCustomerId) return false;
    if (selectedStatus !== 'all' && statement.status !== selectedStatus) return false;
    return true;
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access customer statements
          </p>
          <Button asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Customer Statements
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage customer statements and payment tracking
              </p>
            </div>
            <div className="flex space-x-4">
              <Button asChild>
                <Link href="/customer-statements/new">
                  Generate Statement
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/customer-statements/customers">
                  Manage Customers
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filter Statements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
              >
                <option value="">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'draft' | 'sent')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statements List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Customer Statements
            </h2>
          </div>
          
          <div className="p-6">
            {statementsLoading ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                Loading statements...
              </div>
            ) : filteredStatements.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="mb-4">No customer statements found</p>
                <Button asChild>
                  <Link href="/customer-statements/new">
                    Generate your first statement
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStatements.map((statement) => (
                  <div
                    key={statement.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {statement.statementNumber}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {statement.customer?.name || 'Unknown Customer'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(statement.fromDate).toLocaleDateString()} - {new Date(statement.toDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {/* Financial Summary */}
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(statement.totalSales, currency)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Payments</p>
                        <p className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(statement.totalPayments, currency)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
                        <p className={`font-medium ${statement.outstandingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {formatCurrency(statement.outstandingBalance, currency)}
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        statement.status === 'sent'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {statement.status}
                        {statement.sentVia && (
                          <span className="ml-1">via {statement.sentVia}</span>
                        )}
                      </span>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/customer-statements/${statement.id}`}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                        >
                          View
                        </Link>
                        <Link
                          href={`/customer-statements/${statement.id}/send`}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 text-sm"
                        >
                          Send
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
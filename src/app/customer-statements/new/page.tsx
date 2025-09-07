'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers, useCustomerStatements } from '@/hooks/useCustomerStatements';
import { formatCurrency, CurrencyCode, isSupportedCurrency } from '@/lib/currency-utils';
import { Button } from '@/components/ui/Button';
import { CustomerStatementSummary } from '@/types/customer-statements';

export default function NewCustomerStatementPage() {
  const router = useRouter();
  const { user, settings } = useAuth();
  const { customers, loading: customersLoading } = useCustomers();
  const { generateStatement, createStatement } = useCustomerStatements();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [statementNumber, setStatementNumber] = useState<string>('');
  const [previewData, setPreviewData] = useState<CustomerStatementSummary | null>(null);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);

  const rawCurrency = settings?.invoiceDefaults?.currency || 'INR';
  const currency: CurrencyCode = isSupportedCurrency(rawCurrency) ? rawCurrency : 'INR';

  // Set default dates (last 30 days)
  React.useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    
    // Generate default statement number
    const timestamp = today.getTime();
    setStatementNumber(`STMT-${timestamp}`);
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handlePreviewStatement = async () => {
    if (!selectedCustomer) return;
    
    try {
      setGenerating(true);
      const data = await generateStatement(selectedCustomer.email, fromDate, toDate);
      setPreviewData(data);
    } catch (error) {
      console.error('Error generating statement preview:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateStatement = async () => {
    if (!selectedCustomerId || !statementNumber || !previewData) return;
    
    try {
      setCreating(true);
      await createStatement(selectedCustomerId, statementNumber, fromDate, toDate);
      router.push('/customer-statements');
    } catch (error) {
      console.error('Error creating statement:', error);
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
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
                Generate Customer Statement
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create a new statement for a customer
              </p>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/customer-statements">
                ← Back to Statements
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Statement Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Statement Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statement Number *
                </label>
                <input
                  type="text"
                  value={statementNumber}
                  onChange={(e) => setStatementNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
                  placeholder="STMT-001"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
                />
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={handlePreviewStatement}
                  disabled={!selectedCustomerId || generating}
                  loading={generating}
                  variant="secondary"
                  fullWidth
                >
                  Preview Statement
                </Button>
              </div>
            </div>
          </div>

          {/* Statement Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Statement Preview
            </h2>
            
            {!previewData ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p>Select a customer and click "Preview Statement" to see the data</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {previewData.customerName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {previewData.customerEmail}
                  </p>
                  {previewData.customerPhone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {previewData.customerPhone}
                    </p>
                  )}
                  {previewData.customerAddress && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {previewData.customerAddress}
                    </p>
                  )}
                </div>

                {/* Statement Period */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Statement Period:</strong> {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Financial Summary */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Sales</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(previewData.totalSales, currency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Payments Received</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      -{formatCurrency(previewData.totalPayments, currency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                    <span className="font-medium text-gray-900 dark:text-white">Outstanding Balance</span>
                    <span className={`font-bold ${previewData.outstandingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {formatCurrency(previewData.outstandingBalance, currency)}
                    </span>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Invoices</span>
                      <p className="font-medium text-gray-900 dark:text-white">{previewData.invoiceCount}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Payments</span>
                      <p className="font-medium text-gray-900 dark:text-white">{previewData.paymentCount}</p>
                    </div>
                  </div>
                </div>

                {/* Create Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleCreateStatement}
                    disabled={!statementNumber || creating}
                    loading={creating}
                    fullWidth
                  >
                    Create Statement
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers } from '@/hooks/useCustomerStatements';
import { Button } from '@/components/ui/Button';
import MigrationRequired from '@/components/MigrationRequired';
import { Customer } from '@/types/customer-statements';

export default function CustomersPage() {
  const { user } = useAuth();
  const { customers, loading, createCustomer, error } = useCustomers();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showMigrationWarning, setShowMigrationWarning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    
    try {
      setCreating(true);
      setCreateError(null);
      await createCustomer(formData);
      setFormData({ name: '', email: '', phone: '', address: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
      setCreateError(errorMessage);
      
      // Check if it's a migration-related error
      if (errorMessage.includes('Database migration required') || errorMessage.includes('not yet available')) {
        setShowMigrationWarning(true);
      }
    } finally {
      setCreating(false);
    }
  };

  // Check if we should show migration warning based on loading error
  React.useEffect(() => {
    if (error && (error.includes('table') || error.includes('42P01'))) {
      setShowMigrationWarning(true);
    }
  }, [error]);

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
                Customer Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your customer database
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant={showAddForm ? "secondary" : "primary"}
              >
                {showAddForm ? "Cancel" : "Add Customer"}
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/customer-statements">
                  ← Back to Statements
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Migration Warning */}
        {showMigrationWarning && (
          <MigrationRequired 
            feature="Customer Statements"
            onDismiss={() => setShowMigrationWarning(false)}
          />
        )}

        {/* Add Customer Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Customer
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
                  />
                </div>
              </div>
              
              {/* Error Display */}
              {createError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button type="submit" loading={creating} disabled={!formData.name || !formData.email}>
                  Create Customer
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Customers List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Customers ({customers.length})
            </h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                Loading customers...
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="mb-4">No customers yet</p>
                <Button onClick={() => setShowAddForm(true)}>
                  Add your first customer
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      {customer.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      📧 {customer.email}
                    </p>
                    {customer.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        📱 {customer.phone}
                      </p>
                    )}
                    {customer.address && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        📍 {customer.address}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Added: {new Date(customer.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/customer-statements/new?customerId=${customer.id}`}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                      >
                        Generate Statement
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
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Customer, CustomerStatement, CustomerStatementSummary, Payment, StatementFilters } from '@/types/customer-statements';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 401) {
          setError('Please log in to access customers');
          setCustomers([]);
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setCustomers(data);
      setError(null); // Clear any previous errors on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`;
        
        // Handle specific errors
        if (response.status === 401) {
          throw new Error('Please log in to create customers');
        } else if (response.status === 400 && errorMessage.includes('already exists')) {
          throw new Error('A customer with this email already exists');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const newCustomer = await response.json();
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
  };
}

export function useCustomerStatements(filters?: StatementFilters) {
  const [statements, setStatements] = useState<CustomerStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatements();
  }, [filters]);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate);
      if (filters?.toDate) params.append('toDate', filters.toDate);

      const response = await fetch(`/api/customer-statements?${params}`);
      if (!response.ok) throw new Error('Failed to fetch statements');
      
      const data = await response.json();
      setStatements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateStatement = async (customerEmail: string, fromDate?: string, toDate?: string) => {
    try {
      const response = await fetch('/api/customer-statements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail, fromDate, toDate }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`;
        
        // Handle specific errors
        if (response.status === 401) {
          throw new Error('Please log in to generate statements');
        } else if (response.status === 404) {
          throw new Error('No data found for this customer');
        } else if (errorMessage.includes('Database function not found')) {
          throw new Error('Database migration required. Please contact support.');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    }
  };

  const createStatement = async (customerId: string, statementNumber: string, fromDate?: string, toDate?: string) => {
    try {
      const response = await fetch('/api/customer-statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, statementNumber, fromDate, toDate }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`;
        
        // Handle specific errors
        if (response.status === 401) {
          throw new Error('Please log in to create statements');
        } else if (response.status === 404) {
          throw new Error('Customer not found');
        } else if (response.status === 400 && errorMessage.includes('already exists')) {
          throw new Error('A statement with this number already exists');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const result = await response.json();
      setStatements(prev => [result.statement, ...prev]);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    }
  };

  const markStatementAsSent = async (statementId: string, sentVia: 'email' | 'whatsapp' | 'manual') => {
    try {
      const response = await fetch(`/api/customer-statements/${statementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_sent', sentVia }),
      });
      
      if (!response.ok) throw new Error('Failed to update statement');
      
      // Refresh statements
      await fetchStatements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  return {
    statements,
    loading,
    error,
    fetchStatements,
    generateStatement,
    createStatement,
    markStatementAsSent,
  };
}

export function useCustomerPayments(customerId: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      fetchPayments();
    }
  }, [customerId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments?customerId=${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) throw new Error('Failed to add payment');
      
      const newPayment = await response.json();
      setPayments(prev => [newPayment, ...prev]);
      return newPayment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  return {
    payments,
    loading,
    error,
    fetchPayments,
    addPayment,
  };
}

export function useWhatsAppIntegration() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendStatementViaWhatsApp = async (statementId: string, phoneNumber: string, message: string, attachmentUrl?: string) => {
    try {
      setSending(true);
      setError(null);
      
      const response = await fetch('/api/whatsapp/send-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementId,
          phoneNumber,
          message,
          attachmentUrl,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send WhatsApp message');
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  return {
    sendStatementViaWhatsApp,
    sending,
    error,
  };
}
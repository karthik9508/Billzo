'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerStatements, useWhatsAppIntegration } from '@/hooks/useCustomerStatements';
import { formatCurrency, CurrencyCode, isSupportedCurrency } from '@/lib/currency-utils';
import { Button } from '@/components/ui/Button';
import { CustomerStatement } from '@/types/customer-statements';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SendStatementPage({ params }: PageProps) {
  const router = useRouter();
  const { user, profile, settings } = useAuth();
  const { statements, markStatementAsSent } = useCustomerStatements();
  const { sendStatementViaWhatsApp, sending, error } = useWhatsAppIntegration();
  
  const [statement, setStatement] = useState<CustomerStatement | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [sendVia, setSendVia] = useState<'whatsapp' | 'email' | 'manual'>('whatsapp');

  const rawCurrency = settings?.invoiceDefaults?.currency || 'INR';
  const currency: CurrencyCode = isSupportedCurrency(rawCurrency) ? rawCurrency : 'INR';

  useEffect(() => {
    const loadParams = async () => {
      const { id } = await params;
      const foundStatement = statements.find(s => s.id === id);
      if (foundStatement) {
        setStatement(foundStatement);
        // Pre-populate phone number if available
        if (foundStatement.customer?.phone) {
          setPhoneNumber(foundStatement.customer.phone);
        }
        // Set default message
        setMessage(generateDefaultMessage(foundStatement));
      }
    };
    loadParams();
  }, [params, statements]);

  const generateDefaultMessage = (stmt: CustomerStatement) => {
    return `Hi ${stmt.customer?.name || 'Valued Customer'},

Here's your account statement for the period ${new Date(stmt.fromDate).toLocaleDateString()} - ${new Date(stmt.toDate).toLocaleDateString()}:

📊 *Account Summary*
• Total Sales: ${formatCurrency(stmt.totalSales, currency)}
• Payments Received: ${formatCurrency(stmt.totalPayments, currency)}
• Outstanding Balance: ${formatCurrency(stmt.outstandingBalance, currency)}

${stmt.outstandingBalance > 0 
  ? `⚠️ Please arrange payment for the outstanding amount of ${formatCurrency(stmt.outstandingBalance, currency)} at your earliest convenience.`
  : '✅ Your account is current. Thank you for your prompt payments!'
}

If you have any questions, please don't hesitate to contact us.

Best regards,
${profile?.company?.name || 'Your Business'}`;
  };

  const handleSendWhatsApp = async () => {
    if (!statement || !phoneNumber || !message) return;
    
    try {
      await sendStatementViaWhatsApp(statement.id, phoneNumber, message);
      // Navigate back to statements list
      router.push('/customer-statements');
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    }
  };

  const handleMarkAsSent = async (method: 'email' | 'manual') => {
    if (!statement) return;
    
    try {
      await markStatementAsSent(statement.id, method);
      router.push('/customer-statements');
    } catch (error) {
      console.error('Error marking as sent:', error);
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

  if (!statement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Statement Not Found
          </h2>
          <Button asChild>
            <Link href="/customer-statements">Back to Statements</Link>
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
                Send Statement
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Statement {statement.statementNumber} for {statement.customer?.name}
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
          {/* Send Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Send Statement
            </h2>
            
            {/* Method Selection */}
            <div className="space-y-4 mb-6">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="whatsapp"
                    checked={sendVia === 'whatsapp'}
                    onChange={(e) => setSendVia(e.target.value as 'whatsapp')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    📱 WhatsApp
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="email"
                    checked={sendVia === 'email'}
                    onChange={(e) => setSendVia(e.target.value as 'email')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    📧 Email
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={sendVia === 'manual'}
                    onChange={(e) => setSendVia(e.target.value as 'manual')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    📄 Manual
                  </span>
                </label>
              </div>
            </div>

            {sendVia === 'whatsapp' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
                    placeholder="+1234567890"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
                    rows={12}
                    placeholder="Enter your message..."
                    required
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleSendWhatsApp}
                  disabled={!phoneNumber || !message || sending}
                  loading={sending}
                  fullWidth
                >
                  Send via WhatsApp
                </Button>
              </div>
            )}

            {sendVia === 'email' && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Email integration coming soon. For now, you can mark this statement as sent manually after sending via your email client.
                  </p>
                </div>
                <Button 
                  onClick={() => handleMarkAsSent('email')}
                  variant="secondary"
                  fullWidth
                >
                  Mark as Sent via Email
                </Button>
              </div>
            )}

            {sendVia === 'manual' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use this option if you've sent the statement through other means (printed copy, in-person delivery, etc.).
                  </p>
                </div>
                <Button 
                  onClick={() => handleMarkAsSent('manual')}
                  variant="secondary"
                  fullWidth
                >
                  Mark as Sent Manually
                </Button>
              </div>
            )}
          </div>

          {/* Statement Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Statement Summary
            </h2>
            
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {statement.customer?.name || 'Unknown Customer'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {statement.customer?.email}
                </p>
                {statement.customer?.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {statement.customer.phone}
                  </p>
                )}
              </div>

              {/* Statement Details */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Statement Number:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{statement.statementNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Period:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(statement.fromDate).toLocaleDateString()} - {new Date(statement.toDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Sales</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(statement.totalSales, currency)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Payments Received</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    -{formatCurrency(statement.totalPayments, currency)}
                  </span>
                </div>
                
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                  <span className="font-medium text-gray-900 dark:text-white">Outstanding Balance</span>
                  <span className={`font-bold ${statement.outstandingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {formatCurrency(statement.outstandingBalance, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
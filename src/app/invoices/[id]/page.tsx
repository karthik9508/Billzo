'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInvoice, useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';
import { generateInvoicePDF } from '@/lib/jspdf-invoice-generator';
import { Invoice } from '@/types/invoice';
import { UserProfile } from '@/types/user';
import { formatInvoiceAmount, CurrencyCode, getUserCurrency } from '@/lib/currency-utils';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const { invoice, loading, error } = useInvoice(invoiceId);
  const { saveInvoice } = useInvoices();
  const { profile } = useAuth();
  const [pdfLoading, setPdfLoading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const currency = getUserCurrency();

  const updateStatus = async (newStatus: Invoice['status']) => {
    if (invoice) {
      const updatedInvoice = { ...invoice, status: newStatus };
      try {
        await saveInvoice(updatedInvoice);
        // The useInvoice hook will automatically update with the new data
      } catch (error) {
        console.error('Error updating invoice status:', error);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    setPdfLoading(true);
    try {
      generateInvoicePDF(invoice, profile);
    } catch (error) {
      console.error('PDF download failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setPdfLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'sent':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-semibold text-gray-600">Loading invoice...</h2>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Invoice not found</h2>
          <Link
            href="/invoices"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Link
          href="/invoices"
          className="text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back to Invoices
        </Link>
        
        <div className="flex space-x-3">
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
          >
            Edit
          </Link>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            🖨️ Print
          </button>
          <div className="relative">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {pdfLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span>PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div ref={invoiceRef} className="card rounded-lg shadow-lg p-8 print:shadow-none print:p-0 print:bg-white invoice-content">
        <div className="flex justify-between items-start mb-8">
          <div>
            {profile?.company?.name && (
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 print:text-black mb-2">
                  {profile.company.name}
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 print:text-black space-y-1">
                  {profile.company.address && (
                    <div className="whitespace-pre-line">{profile.company.address}</div>
                  )}
                  {profile.company.phone && (
                    <div>Phone: {profile.company.phone}</div>
                  )}
                  {profile.company.email && (
                    <div>Email: {profile.company.email}</div>
                  )}
                  {profile.company.website && (
                    <div>Website: {profile.company.website}</div>
                  )}
                </div>
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 print:text-black">Invoice</h1>
            <p className="text-gray-600 dark:text-gray-400 print:text-black">{invoice.invoiceNumber}</p>
          </div>
          
          <div className="text-right print:hidden">
            <div className="flex items-center space-x-4 mb-4">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                {invoice.status.toUpperCase()}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                invoice.mode === 'ai' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
              }`}>
                {invoice.mode === 'ai' ? '🤖 AI Generated' : '✏️ Manual'}
              </span>
            </div>
            
            <div className="space-y-2">
              {invoice.status === 'draft' && (
                <button
                  onClick={() => updateStatus('sent')}
                  className="block w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Mark as Sent
                </button>
              )}
              {invoice.status === 'sent' && (
                <button
                  onClick={() => updateStatus('paid')}
                  className="block w-full px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Mark as Paid
                </button>
              )}
              {(invoice.status === 'sent' || invoice.status === 'draft') && (
                <button
                  onClick={() => updateStatus('overdue')}
                  className="block w-full px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Mark as Overdue
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 print:text-black mb-3">Bill To:</h3>
            <div className="text-gray-700 dark:text-gray-300 print:text-black space-y-1">
              <p className="font-medium">{invoice.client.name}</p>
              <p>{invoice.client.email}</p>
              <p className="whitespace-pre-line">{invoice.client.address}</p>
              {invoice.client.phone && <p>{invoice.client.phone}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 print:text-black mb-3">Invoice Details:</h3>
            <div className="text-gray-700 dark:text-gray-300 print:text-black space-y-1">
              <div className="flex justify-between">
                <span>Invoice Date:</span>
                <span>{new Date(invoice.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice #:</span>
                <span>{invoice.invoiceNumber}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 font-semibold text-gray-900 dark:text-gray-100 print:text-black">Description</th>
                  <th className="text-center py-3 font-semibold text-gray-900 dark:text-gray-100 print:text-black">Qty</th>
                  <th className="text-right py-3 font-semibold text-gray-900 dark:text-gray-100 print:text-black">Rate</th>
                  <th className="text-right py-3 font-semibold text-gray-900 dark:text-gray-100 print:text-black">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3 text-gray-700 dark:text-gray-300 print:text-black">{item.description}</td>
                    <td className="py-3 text-center text-gray-700 dark:text-gray-300 print:text-black">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-700 dark:text-gray-300 print:text-black">{formatInvoiceAmount(item.rate, currency)}</td>
                    <td className="py-3 text-right font-medium text-gray-900 dark:text-gray-100 print:text-black">{formatInvoiceAmount(item.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between py-1">
              <span className="text-gray-600 dark:text-gray-400 print:text-black">Subtotal:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 print:text-black">{formatInvoiceAmount(invoice.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 dark:text-gray-400 print:text-black">Tax:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 print:text-black">{formatInvoiceAmount(invoice.tax, currency)}</span>
            </div>
            <div className="flex justify-between py-2 text-lg font-bold border-t border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 print:text-black print:border-black">
              <span>Total:</span>
              <span>{formatInvoiceAmount(invoice.total, currency)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 print:text-black mb-3">Notes:</h3>
            <p className="text-gray-700 dark:text-gray-300 print:text-black whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 print:border-black pt-6 mt-8 text-center text-gray-500 dark:text-gray-400 print:text-black text-sm">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
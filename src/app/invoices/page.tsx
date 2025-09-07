'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice } from '@/types/invoice';
import PDFDownloadButton from '@/components/PDFDownloadButton';
import { formatInvoiceAmount, CurrencyCode, getUserCurrency } from '@/lib/currency-utils';
import { Button } from '@/components/ui/Button';

export default function InvoicesPage() {
  const { invoices, loading, error, deleteInvoice } = useInvoices();
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const currency = getUserCurrency();


  const filteredInvoices = invoices.filter(invoice => 
    filter === 'all' || invoice.status === filter
  );

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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id);
        // The useInvoices hook will automatically refresh the data
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all your invoices</p>
        </div>
        <Button asChild leftIcon={<span>➕</span>}>
          <Link href="/invoices/new">
            Create Invoice
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex space-x-2">
        {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === status
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                {invoices.filter(inv => inv.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Loading invoices...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we fetch your invoices
          </p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {filter === 'all' ? 'No invoices yet' : `No ${filter} invoices`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === 'all' 
              ? 'Get started by creating your first invoice'
              : `You don't have any ${filter} invoices at the moment`
            }
          </p>
          <Button asChild>
            <Link href="/invoices/new">
              Create Invoice
            </Link>
          </Button>
        </div>
      ) : (
        <div className="card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Invoice #</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Client</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Amount</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Date</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Mode</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-4 px-6">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-gray-900 dark:text-gray-100">{invoice.client.name}</td>
                    <td className="py-4 px-6 font-medium">{formatInvoiceAmount(invoice.total, currency)}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.mode === 'ai' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                      }`}>
                        {invoice.mode === 'ai' ? '🤖 AI' : '✏️ Manual'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/invoices/${invoice.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </Link>
                        <PDFDownloadButton 
                          invoice={invoice} 
                          variant="secondary" 
                          size="sm"
                          className="text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
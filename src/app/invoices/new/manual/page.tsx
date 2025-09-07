'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { UserSettings } from '@/types/user';
import ThemeToggle from '@/components/TextColorToggle';
import { formatInvoiceAmount, CurrencyCode, isSupportedCurrency } from '@/lib/currency-utils';
import CurrencyInput, { CurrencyInputInvoice } from '@/components/CurrencyInput';
import CurrencyDisplay from '@/components/CurrencyDisplay';

export default function ManualInvoicePage() {
  const router = useRouter();
  const { saveInvoice } = useInvoices();
  const { settings } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientPhone: '',
    dueDate: '',
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    },
  ]);

  useEffect(() => {
    if (settings) {
      // Set default notes from user preferences
      setFormData(prev => ({
        ...prev,
        notes: settings.invoiceDefaults.notes || '',
      }));
    }
  }, [settings]);

  const generateInvoiceNumber = () => {
    return `INV-${Date.now()}`;
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = Number(updatedItem.quantity) * Number(updatedItem.rate);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = settings?.invoiceDefaults.taxRate || 10;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  // Get user's selected currency
  const rawCurrency = settings?.invoiceDefaults?.currency || 'INR';
  const currency: CurrencyCode = isSupportedCurrency(rawCurrency) ? rawCurrency : 'INR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const invoice: Invoice = {
        id: crypto.randomUUID(),
        invoiceNumber: generateInvoiceNumber(),
        date: new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate,
        status: 'draft',
        client: {
          name: formData.clientName,
          email: formData.clientEmail,
          address: formData.clientAddress,
          phone: formData.clientPhone || undefined,
        },
        items: items.filter(item => item.description.trim() !== ''),
        subtotal,
        tax,
        total,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        mode: 'manual',
      };

      await saveInvoice(invoice);
      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error saving invoice:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Manual Invoice</h1>
          <p className="text-gray-600 dark:text-gray-400">Fill in all the details to create your invoice</p>
        </div>
        <ThemeToggle />
      </div>

      <form onSubmit={handleSubmit} className="card rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Client Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter client name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client Email *
              </label>
              <input
                type="email"
                required
                value={formData.clientEmail}
                onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="client@example.com"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Client Address *
            </label>
            <textarea
              required
              value={formData.clientAddress}
              onChange={(e) => setFormData({...formData, clientAddress: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Enter client address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client Phone
              </label>
              <input
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Invoice Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Item description"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="col-span-2">
                  <CurrencyInputInvoice
                    label="Rate"
                    value={item.rate}
                    onChange={(value) => updateItem(item.id, 'rate', value)}
                    currency={currency}
                    showCode={true}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <div className="amount-display px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-right font-medium bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <CurrencyDisplay amount={item.amount} currency={currency} />
                  </div>
                </div>

                <div className="col-span-1">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="px-2 py-2 text-red-600 hover:text-red-800"
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  <CurrencyDisplay amount={subtotal} currency={currency} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax ({taxRate}%):</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  <CurrencyDisplay amount={tax} currency={currency} />
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 text-gray-900 dark:text-gray-100">
                <span>Total:</span>
                <span>
                  <CurrencyDisplay amount={total} currency={currency} className="text-lg font-bold" />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Add any additional notes or terms..."
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create Invoice
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
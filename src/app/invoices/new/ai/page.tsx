'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice, InvoiceItem } from '@/types/invoice';
import ThemeToggle from '@/components/TextColorToggle';
import { Button } from '@/components/ui/Button';

export default function AIInvoicePage() {
  const router = useRouter();
  const { saveInvoice } = useInvoices();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');

  const generateInvoiceNumber = () => {
    return `INV-${Date.now()}`;
  };

  const generateAIInvoice = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your invoice');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate invoice');
      }

      const aiData = result.data;
      
      // Create invoice items from AI response
      const items: InvoiceItem[] = aiData.items.map((item: any) => ({
        id: crypto.randomUUID(),
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }));

      const invoice: Invoice = {
        id: crypto.randomUUID(),
        invoiceNumber: generateInvoiceNumber(),
        date: new Date().toISOString().split('T')[0],
        dueDate: aiData.dueDate,
        status: 'draft',
        client: {
          name: aiData.clientName,
          email: aiData.clientEmail,
          address: aiData.clientAddress,
          phone: aiData.clientPhone || undefined,
        },
        items,
        subtotal: aiData.subtotal,
        tax: aiData.tax,
        total: aiData.total,
        notes: aiData.notes,
        createdAt: new Date().toISOString(),
        mode: 'ai',
      };

      await saveInvoice(invoice);
      router.push(`/invoices/${invoice.id}/edit`);
    } catch (error) {
      console.error('Error generating AI invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateAIInvoice();
  };

  const examplePrompts = [
    "Create an invoice for ABC Company at 123 Main St, New York. I provided web development services: homepage design ($2,000), contact form setup ($500), and mobile optimization ($800).",
    "Invoice for consulting work with John Smith at Tech Solutions Inc, 456 Oak Ave, Los Angeles. 15 hours of business strategy at $150/hour plus a market analysis report for $750. Due in 30 days.",
    "Bill Sarah Johnson at Creative Agency, 789 Pine St, Chicago for graphic design services: logo design ($1,200), brochure design ($800), and social media graphics ($600).",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4">
          <span className="text-white text-2xl">🤖</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">AI Invoice Generator</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Create professional invoices in seconds with natural language</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Input Card */}
        <div className="card rounded-xl shadow-lg p-8 border-0">
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100">
              Describe your invoice
            </label>
            <textarea
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none transition-all duration-200"
              rows={6}
              placeholder="Example: Invoice John Doe at ABC Corp for web design: logo ($800), website ($2000), SEO ($500). Due in 30 days."
            />
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Features Highlight */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 text-xl">📝</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Smart Parsing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automatically extracts client info and services</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-xl">💰</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Auto Calculations</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Handles taxes, totals, and pricing</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 text-xl">⚡</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Instant Results</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Professional invoice in seconds</p>
          </div>
        </div>

        {/* Quick Examples - Collapsible */}
        <details className="card rounded-lg shadow p-6 border-0">
          <summary className="cursor-pointer font-semibold text-gray-900 dark:text-gray-100 mb-4 hover:text-blue-600 transition-colors">
            💡 Need inspiration? View example prompts
          </summary>
          <div className="space-y-3 pt-2">
            {examplePrompts.map((example, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">"{example}"</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPrompt(example)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Use this example
                </Button>
              </div>
            ))}
          </div>
        </details>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            size="lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !prompt.trim()}
            loading={loading}
            leftIcon={!loading && <span>🚀</span>}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8"
          >
            {loading ? 'Generating Invoice...' : 'Generate Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}
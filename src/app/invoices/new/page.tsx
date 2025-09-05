'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function NewInvoicePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'ai' | 'manual' | null>(null);

  const handleModeSelection = (selectedMode: 'ai' | 'manual') => {
    setMode(selectedMode);
    if (selectedMode === 'ai') {
      router.push('/invoices/new/ai');
    } else {
      router.push('/invoices/new/manual');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Invoice</h1>
        <p className="text-gray-600 dark:text-gray-400">Choose how you'd like to create your invoice</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          onClick={() => handleModeSelection('ai')}
          className="card p-8 rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl border-2 border-transparent hover:border-blue-500"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">AI-Powered</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Let AI help you create professional invoices quickly. Just provide some basic information and AI will generate a complete invoice for you.
            </p>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-all hover:shadow-md">
              Create with AI
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Smart item suggestions
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Automatic calculations
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Professional formatting
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Fast generation
            </div>
          </div>
        </div>

        <div 
          onClick={() => handleModeSelection('manual')}
          className="card p-8 rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl border-2 border-transparent hover:border-green-500"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">✏️</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Manual Entry</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create invoices manually with full control over every detail. Perfect for when you need specific customization.
            </p>
            <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-all hover:shadow-md">
              Create Manually
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Complete control
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Custom formatting
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Detailed input fields
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Step-by-step process
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={<span>←</span>}
        >
          Back to Invoices
        </Button>
      </div>
    </div>
  );
}
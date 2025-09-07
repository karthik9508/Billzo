'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { CUSTOMER_STATEMENTS_MIGRATION_SQL } from '@/lib/migration-sql';

interface MigrationRequiredProps {
  feature: string;
  onDismiss?: () => void;
}

export default function MigrationRequired({ feature, onDismiss }: MigrationRequiredProps) {
  const handleCopySQL = () => {
    navigator.clipboard.writeText(CUSTOMER_STATEMENTS_MIGRATION_SQL).then(() => {
      alert('SQL migration copied to clipboard! Paste it in your Supabase SQL Editor.');
    }).catch(() => {
      console.error('Failed to copy SQL to clipboard');
      alert('Failed to copy to clipboard. Please copy the SQL from the browser console.');
      console.log('Migration SQL:', CUSTOMER_STATEMENTS_MIGRATION_SQL);
    });
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 m-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
            Database Migration Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p className="mb-3">
              The <strong>{feature}</strong> feature requires additional database tables that haven't been created yet.
            </p>
            <p className="mb-3">
              To enable this feature, please run the database migration in your Supabase dashboard:
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Supabase Dashboard</a></li>
              <li>Navigate to your project → SQL Editor</li>
              <li>Click the button below to copy the migration SQL</li>
              <li>Paste and run the SQL in the editor</li>
              <li>Refresh this page to use the new features</li>
            </ol>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleCopySQL} variant="warning">
              📋 Copy Migration SQL
            </Button>
            <Button 
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              variant="secondary"
            >
              🚀 Open Supabase Dashboard
            </Button>
            {onDismiss && (
              <Button onClick={onDismiss} variant="ghost">
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
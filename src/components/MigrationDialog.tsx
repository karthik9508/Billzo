'use client';

import { useState } from 'react'
import { migrationService } from '@/lib/migration'

interface MigrationDialogProps {
  onClose: () => void
  onMigrationComplete: () => void
}

export default function MigrationDialog({ onClose, onMigrationComplete }: MigrationDialogProps) {
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)

  const handleMigrate = async () => {
    setMigrating(true)
    try {
      const result = await migrationService.migrateFromLocalStorage()
      setMigrationResult(result)
      
      if (result.success) {
        // Clear localStorage after successful migration
        await migrationService.clearLocalStorageAfterMigration()
        setTimeout(() => {
          onMigrationComplete()
          onClose()
        }, 3000)
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `Migration failed: ${error}`,
        details: { errors: [String(error)] }
      })
    } finally {
      setMigrating(false)
    }
  }

  const handleSkip = () => {
    // Clear localStorage even if skipping migration
    migrationService.clearLocalStorageAfterMigration()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Migrate Local Data
        </h2>
        
        {!migrationResult ? (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We found existing data in your browser's local storage. Would you like to migrate it to your cloud account?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {migrating ? 'Migrating...' : 'Migrate Data'}
              </button>
              
              <button
                onClick={handleSkip}
                disabled={migrating}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                Skip
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`p-4 rounded mb-4 ${
              migrationResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            }`}>
              <p className="font-medium">
                {migrationResult.success ? 'Migration Successful!' : 'Migration Failed'}
              </p>
              <p className="text-sm mt-1">{migrationResult.message}</p>
            </div>

            {migrationResult.details && (
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                <p>Invoices migrated: {migrationResult.details.invoicesMigrated}</p>
                <p>Profile migrated: {migrationResult.details.profileMigrated ? 'Yes' : 'No'}</p>
                <p>Settings migrated: {migrationResult.details.settingsMigrated ? 'Yes' : 'No'}</p>
                
                {migrationResult.details.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-600 dark:text-red-400 font-medium">Errors:</p>
                    <ul className="list-disc list-inside text-xs">
                      {migrationResult.details.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {migrationResult.success && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                This dialog will close automatically in a few seconds...
              </p>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}
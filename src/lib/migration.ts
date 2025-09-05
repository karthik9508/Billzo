'use client';

import { invoiceStorage } from '@/lib/invoice-storage'
import { userStorage } from '@/lib/user-storage'
import { invoiceService } from '@/lib/supabase/services/invoice'
import { profileService } from '@/lib/supabase/services/profile'
import { settingsService } from '@/lib/supabase/services/settings'
import { authService } from '@/lib/supabase/services/auth'
import { Invoice } from '@/types/invoice'
import { UserProfile, UserSettings } from '@/types/user'

interface MigrationResult {
  success: boolean
  message: string
  details: {
    invoicesMigrated: number
    profileMigrated: boolean
    settingsMigrated: boolean
    errors: string[]
  }
}

export const migrationService = {
  async migrateFromLocalStorage(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: '',
      details: {
        invoicesMigrated: 0,
        profileMigrated: false,
        settingsMigrated: false,
        errors: []
      }
    }

    try {
      // Check if user is authenticated
      const user = await authService.getCurrentUser()
      if (!user) {
        result.message = 'User must be authenticated to migrate data'
        return result
      }

      // Check if there's any localStorage data to migrate
      const hasLocalData = await this.hasLocalStorageData()
      if (!hasLocalData) {
        result.success = true
        result.message = 'No localStorage data found to migrate'
        return result
      }

      // Migrate user profile
      try {
        const localProfile = userStorage.getProfile()
        if (localProfile) {
          const existingProfile = await profileService.getCurrentProfile()
          if (!existingProfile) {
            await profileService.createProfile({
              name: localProfile.name,
              email: localProfile.email,
              avatar: localProfile.avatar,
              company: localProfile.company
            })
            result.details.profileMigrated = true
          }
        }
      } catch (error) {
        result.details.errors.push(`Profile migration failed: ${error}`)
      }

      // Migrate user settings
      try {
        const localSettings = userStorage.getSettings()
        if (localSettings) {
          await settingsService.updateSettings(localSettings)
          result.details.settingsMigrated = true
        }
      } catch (error) {
        result.details.errors.push(`Settings migration failed: ${error}`)
      }

      // Migrate invoices
      try {
        const localInvoices = invoiceStorage.getAll()
        let successfullyMigrated = 0

        for (const invoice of localInvoices) {
          try {
            // Check if invoice already exists in Supabase
            const existingInvoice = await invoiceService.getInvoiceById(invoice.id)
            if (!existingInvoice) {
              await invoiceService.saveInvoice(invoice)
              successfullyMigrated++
            }
          } catch (error) {
            result.details.errors.push(`Failed to migrate invoice ${invoice.invoiceNumber}: ${error}`)
          }
        }

        result.details.invoicesMigrated = successfullyMigrated
      } catch (error) {
        result.details.errors.push(`Invoice migration failed: ${error}`)
      }

      // Determine overall success
      const hasErrors = result.details.errors.length > 0
      result.success = !hasErrors || (result.details.invoicesMigrated > 0 || result.details.profileMigrated || result.details.settingsMigrated)

      if (result.success) {
        result.message = `Migration completed. ${result.details.invoicesMigrated} invoices, profile: ${result.details.profileMigrated ? 'Yes' : 'No'}, settings: ${result.details.settingsMigrated ? 'Yes' : 'No'}`
      } else {
        result.message = 'Migration failed with errors'
      }

      return result

    } catch (error) {
      result.success = false
      result.message = `Migration failed: ${error}`
      result.details.errors.push(String(error))
      return result
    }
  },

  async hasLocalStorageData(): Promise<boolean> {
    if (typeof window === 'undefined') return false

    const hasProfile = userStorage.getProfile() !== null
    const hasInvoices = invoiceStorage.getAll().length > 0
    const hasSettings = localStorage.getItem('user_settings') !== null

    return hasProfile || hasInvoices || hasSettings
  },

  async clearLocalStorageAfterMigration(): Promise<void> {
    if (typeof window === 'undefined') return

    // Clear all localStorage data after successful migration
    userStorage.clearAllData()
    
    // Also clear any theme data if it's separate
    localStorage.removeItem('theme')
  },

  async exportLocalStorageData(): Promise<string> {
    if (typeof window === 'undefined') throw new Error('localStorage not available')

    const data = {
      profile: userStorage.getProfile(),
      settings: userStorage.getSettings(),
      invoices: invoiceStorage.getAll(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }

    return JSON.stringify(data, null, 2)
  },

  async importAndMigrateFromFile(jsonData: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: '',
      details: {
        invoicesMigrated: 0,
        profileMigrated: false,
        settingsMigrated: false,
        errors: []
      }
    }

    try {
      const user = await authService.getCurrentUser()
      if (!user) {
        result.message = 'User must be authenticated to import data'
        return result
      }

      const importData = JSON.parse(jsonData)

      // Migrate profile
      if (importData.profile) {
        try {
          const existingProfile = await profileService.getCurrentProfile()
          if (!existingProfile) {
            await profileService.createProfile({
              name: importData.profile.name,
              email: importData.profile.email,
              avatar: importData.profile.avatar,
              company: importData.profile.company
            })
            result.details.profileMigrated = true
          }
        } catch (error) {
          result.details.errors.push(`Profile import failed: ${error}`)
        }
      }

      // Migrate settings
      if (importData.settings) {
        try {
          await settingsService.updateSettings(importData.settings)
          result.details.settingsMigrated = true
        } catch (error) {
          result.details.errors.push(`Settings import failed: ${error}`)
        }
      }

      // Migrate invoices
      if (importData.invoices && Array.isArray(importData.invoices)) {
        let successfullyMigrated = 0

        for (const invoice of importData.invoices) {
          try {
            const existingInvoice = await invoiceService.getInvoiceById(invoice.id)
            if (!existingInvoice) {
              await invoiceService.saveInvoice(invoice)
              successfullyMigrated++
            }
          } catch (error) {
            result.details.errors.push(`Failed to import invoice ${invoice.invoiceNumber}: ${error}`)
          }
        }

        result.details.invoicesMigrated = successfullyMigrated
      }

      const hasErrors = result.details.errors.length > 0
      result.success = !hasErrors || (result.details.invoicesMigrated > 0 || result.details.profileMigrated || result.details.settingsMigrated)

      if (result.success) {
        result.message = `Import completed. ${result.details.invoicesMigrated} invoices, profile: ${result.details.profileMigrated ? 'Yes' : 'No'}, settings: ${result.details.settingsMigrated ? 'Yes' : 'No'}`
      } else {
        result.message = 'Import failed with errors'
      }

      return result

    } catch (error) {
      result.success = false
      result.message = `Import failed: ${error}`
      result.details.errors.push(String(error))
      return result
    }
  }
}
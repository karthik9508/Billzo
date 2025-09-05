import { supabase } from '@/lib/supabase/client'
import { UserSettings, DEFAULT_USER_SETTINGS } from '@/types/user'
import { Database } from '@/types/database'

type SettingsRow = Database['public']['Tables']['user_settings']['Row']
type SettingsUpdate = Database['public']['Tables']['user_settings']['Update']

export const settingsService = {
  async getCurrentSettings(): Promise<UserSettings> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return DEFAULT_USER_SETTINGS

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.warn('Settings not found for user (using defaults):', error.message)
        return DEFAULT_USER_SETTINGS
      }

      return this.mapRowToUserSettings(data)
    } catch (error) {
      console.warn('Settings fetch failed (using defaults):', error)
      return DEFAULT_USER_SETTINGS
    }
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const updateData: SettingsUpdate = {
      theme: settings.theme,
      email_notifications: settings.notifications?.emailNotifications,
      overdue_reminders: settings.notifications?.overdueReminders,
      payment_confirmations: settings.notifications?.paymentConfirmations,
      tax_rate: settings.invoiceDefaults?.taxRate,
      currency: settings.invoiceDefaults?.currency,
      payment_terms: settings.invoiceDefaults?.paymentTerms,
      notes: settings.invoiceDefaults?.notes,
      date_format: settings.preferences?.dateFormat,
      number_format: settings.preferences?.numberFormat,
      auto_save: settings.preferences?.autoSave,
    }

    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    ) as SettingsUpdate

    const { data, error } = await supabase
      .from('user_settings')
      .update(cleanUpdateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating settings:', error)
      throw error
    }

    return this.mapRowToUserSettings(data)
  },

  mapRowToUserSettings(row: SettingsRow): UserSettings {
    return {
      theme: row.theme as 'light' | 'dark' | 'system',
      notifications: {
        emailNotifications: row.email_notifications,
        overdueReminders: row.overdue_reminders,
        paymentConfirmations: row.payment_confirmations,
      },
      invoiceDefaults: {
        taxRate: Number(row.tax_rate),
        currency: row.currency,
        paymentTerms: row.payment_terms,
        notes: row.notes || undefined,
      },
      preferences: {
        dateFormat: row.date_format as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD',
        numberFormat: row.number_format as 'US' | 'EU' | 'UK',
        autoSave: row.auto_save,
      },
    }
  },

  // Real-time subscription for settings changes
  subscribeToSettingsChanges(callback: (settings: UserSettings) => void) {
    return supabase
      .channel('settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
        },
        (payload) => {
          if (payload.eventType !== 'DELETE') {
            callback(this.mapRowToUserSettings(payload.new as SettingsRow))
          }
        }
      )
      .subscribe()
  }
}
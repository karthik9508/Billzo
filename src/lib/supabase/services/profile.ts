import { supabase } from '@/lib/supabase/client'
import { UserProfile } from '@/types/user'
import { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['user_profiles']['Row']
type ProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export const profileService = {
  async getCurrentProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.warn('Profile not found for user (this is normal for new users):', error.message)
        return null
      }

      return this.mapRowToUserProfile(data)
    } catch (error) {
      console.warn('Profile fetch failed:', error)
      return null
    }
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const updateData: ProfileUpdate = {
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
      company_name: profile.company?.name,
      company_address: profile.company?.address,
      company_phone: profile.company?.phone,
      company_email: profile.company?.email,
      company_website: profile.company?.website,
      company_tax_id: profile.company?.taxId,
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    return this.mapRowToUserProfile(data)
  },

  async createProfile(profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const insertData: ProfileInsert = {
      user_id: user.id,
      name: profileData.name,
      email: profileData.email,
      avatar: profileData.avatar,
      company_name: profileData.company.name,
      company_address: profileData.company.address,
      company_phone: profileData.company.phone,
      company_email: profileData.company.email,
      company_website: profileData.company.website,
      company_tax_id: profileData.company.taxId,
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      throw error
    }

    return this.mapRowToUserProfile(data)
  },

  mapRowToUserProfile(row: ProfileRow): UserProfile {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: row.avatar || undefined,
      company: {
        name: row.company_name,
        address: row.company_address,
        phone: row.company_phone || undefined,
        email: row.company_email || undefined,
        website: row.company_website || undefined,
        taxId: row.company_tax_id || undefined,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  },

  // Real-time subscription for profile changes
  subscribeToProfileChanges(callback: (profile: UserProfile | null) => void) {
    return supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            callback(null)
          } else {
            callback(this.mapRowToUserProfile(payload.new as ProfileRow))
          }
        }
      )
      .subscribe()
  }
}
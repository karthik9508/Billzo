'use client';

import React, { useState, useEffect, createContext, useContext } from 'react'
import { User } from '@supabase/supabase-js'
import { authService } from '@/lib/supabase/services/auth'
import { UserProfile, UserSettings } from '@/types/user'
import { profileService } from '@/lib/supabase/services/profile'
import { settingsService } from '@/lib/supabase/services/settings'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  settings: UserSettings | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (name: string, email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Safety mechanism: ensure loading doesn't persist indefinitely
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading taking too long, forcing completion')
        setLoading(false)
      }
    }, 5000) // 5 second absolute maximum

    if (!loading) {
      clearTimeout(safetyTimeout)
    }

    return () => clearTimeout(safetyTimeout)
  }, [loading])

  useEffect(() => {
    // Get initial session - FAST, don't load extra data yet
    const getInitialSession = async () => {
      try {
        const session = await authService.getSession()
        setUser(session?.user ?? null)
        
        // Don't wait for profile/settings - load them in background
        if (session?.user) {
          // Load user data in background without blocking UI
          loadUserData().catch(error => {
            console.warn('Background user data loading failed:', error)
          })
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setUser(null)
      } finally {
        // Always stop loading quickly
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event)
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Load user data in background after setting user
          loadUserData().catch(error => {
            console.warn('Background user data loading failed:', error)
          })
        } else {
          setProfile(null)
          setSettings(null)
        }
        
        // Don't keep loading state here - user is already set
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async () => {
    try {
      // Much shorter timeouts - fail fast
      const profilePromise = Promise.race([
        profileService.getCurrentProfile(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 3000)) // 3 seconds
      ]).catch(error => {
        console.warn('Profile service error (using null):', error.message)
        return null
      })
      
      const settingsPromise = Promise.race([
        settingsService.getCurrentSettings(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Settings timeout')), 3000)) // 3 seconds
      ]).catch(error => {
        console.warn('Settings service error (using null):', error.message)
        return null
      })

      const [userProfile, userSettings] = await Promise.all([
        profilePromise,
        settingsPromise
      ])
      
      setProfile(userProfile)
      setSettings(userSettings)
    } catch (error) {
      console.error('Error loading user data:', error)
      // Set defaults to prevent infinite loading
      setProfile(null)
      setSettings(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user, error } = await authService.signIn({ email, password })
      
      if (user) {
        await loadUserData()
      }
      
      return { error }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      const { user, error } = await authService.signUp({ 
        name, 
        email, 
        password, 
        confirmPassword: password 
      })
      
      if (user) {
        await loadUserData()
      }
      
      return { error }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authService.signOut()
      setUser(null)
      setProfile(null)
      setSettings(null)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated')
    
    const updatedProfile = await profileService.updateProfile(profileData)
    if (updatedProfile) {
      setProfile(updatedProfile)
    }
  }

  const updateSettings = async (settingsData: Partial<UserSettings>) => {
    if (!user) throw new Error('User not authenticated')
    
    const updatedSettings = await settingsService.updateSettings(settingsData)
    setSettings(updatedSettings)
  }

  const value: AuthContextType = {
    user,
    profile,
    settings,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateSettings,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
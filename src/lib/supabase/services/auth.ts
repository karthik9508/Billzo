import { supabase } from '@/lib/supabase/client'
import { SignupData, LoginCredentials } from '@/types/user'
import { AuthError, User } from '@supabase/supabase-js'

export const authService = {
  async signUp(signupData: SignupData): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        data: {
          name: signupData.name,
        },
      },
    })

    return { user: data.user, error }
  },

  async signIn(credentials: LoginCredentials): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    return { user: data.user, error }
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error }
  },

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error }
  },

  async updateEmail(newEmail: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    })
    return { error }
  },

  // Auth state subscription
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user !== null
  },

  // Get user session
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },
}
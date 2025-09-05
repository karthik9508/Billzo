export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          avatar: string | null
          company_name: string
          company_address: string
          company_phone: string | null
          company_email: string | null
          company_website: string | null
          company_tax_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          avatar?: string | null
          company_name: string
          company_address: string
          company_phone?: string | null
          company_email?: string | null
          company_website?: string | null
          company_tax_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          avatar?: string | null
          company_name?: string
          company_address?: string
          company_phone?: string | null
          company_email?: string | null
          company_website?: string | null
          company_tax_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          email_notifications: boolean
          overdue_reminders: boolean
          payment_confirmations: boolean
          tax_rate: number
          currency: string
          payment_terms: string
          notes: string | null
          date_format: string
          number_format: string
          auto_save: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          email_notifications?: boolean
          overdue_reminders?: boolean
          payment_confirmations?: boolean
          tax_rate?: number
          currency?: string
          payment_terms?: string
          notes?: string | null
          date_format?: string
          number_format?: string
          auto_save?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          email_notifications?: boolean
          overdue_reminders?: boolean
          payment_confirmations?: boolean
          tax_rate?: number
          currency?: string
          payment_terms?: string
          notes?: string | null
          date_format?: string
          number_format?: string
          auto_save?: boolean
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          invoice_number: string
          date: string
          due_date: string
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          client_name: string
          client_email: string
          client_address: string
          client_phone: string | null
          subtotal: number
          tax: number
          total: number
          notes: string | null
          mode: 'ai' | 'manual'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          invoice_number: string
          date: string
          due_date: string
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          client_name: string
          client_email: string
          client_address: string
          client_phone?: string | null
          subtotal: number
          tax: number
          total: number
          notes?: string | null
          mode: 'ai' | 'manual'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          invoice_number?: string
          date?: string
          due_date?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          client_name?: string
          client_email?: string
          client_address?: string
          client_phone?: string | null
          subtotal?: number
          tax?: number
          total?: number
          notes?: string | null
          mode?: 'ai' | 'manual'
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          rate: number
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity: number
          rate: number
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          rate?: number
          amount?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
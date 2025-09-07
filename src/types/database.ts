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
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          invoice_id: string | null
          customer_id: string
          amount: number
          payment_date: string
          payment_method: 'cash' | 'check' | 'bank_transfer' | 'card' | 'other'
          reference_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          invoice_id?: string | null
          customer_id: string
          amount: number
          payment_date: string
          payment_method?: 'cash' | 'check' | 'bank_transfer' | 'card' | 'other'
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          invoice_id?: string | null
          customer_id?: string
          amount?: number
          payment_date?: string
          payment_method?: 'cash' | 'check' | 'bank_transfer' | 'card' | 'other'
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_statements: {
        Row: {
          id: string
          user_id: string
          customer_id: string
          statement_number: string
          from_date: string
          to_date: string
          total_sales: number
          total_payments: number
          outstanding_balance: number
          status: 'draft' | 'sent'
          sent_via: 'email' | 'whatsapp' | 'manual' | null
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id: string
          statement_number: string
          from_date: string
          to_date: string
          total_sales?: number
          total_payments?: number
          outstanding_balance?: number
          status?: 'draft' | 'sent'
          sent_via?: 'email' | 'whatsapp' | 'manual' | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string
          statement_number?: string
          from_date?: string
          to_date?: string
          total_sales?: number
          total_payments?: number
          outstanding_balance?: number
          status?: 'draft' | 'sent'
          sent_via?: 'email' | 'whatsapp' | 'manual' | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_customer_statement: {
        Args: {
          p_user_id: string
          p_customer_email: string
          p_from_date?: string | null
          p_to_date?: string | null
        }
        Returns: {
          customer_name: string
          customer_email: string
          customer_phone: string | null
          customer_address: string | null
          total_sales: number
          total_payments: number
          outstanding_balance: number
          invoice_count: number
          payment_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
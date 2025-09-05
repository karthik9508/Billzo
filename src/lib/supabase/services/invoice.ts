import { supabase } from '@/lib/supabase/client'
import { Invoice, InvoiceItem, DashboardStats } from '@/types/invoice'
import { Database } from '@/types/database'

type InvoiceRow = Database['public']['Tables']['invoices']['Row']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']
type InvoiceItemRow = Database['public']['Tables']['invoice_items']['Row']
type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert']

export const invoiceService = {
  // Cache user for performance
  _cachedUser: null as any,
  _userCacheTime: 0,
  
  async getCachedUser() {
    const now = Date.now()
    if (!this._cachedUser || (now - this._userCacheTime) > 60000) { // Cache for 1 minute
      const { data: { user } } = await supabase.auth.getUser()
      this._cachedUser = user
      this._userCacheTime = now
    }
    return this._cachedUser
  },

  async getAllInvoices(): Promise<Invoice[]> {
    const user = await this.getCachedUser()
    if (!user) return []

    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return []
    }

    return invoicesData.map(this.mapRowToInvoice)
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const user = await this.getCachedUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return null
    }

    return this.mapRowToInvoice(data)
  },

  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    const user = await this.getCachedUser()
    if (!user) throw new Error('User not authenticated')

    // Check if invoice exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', invoice.id)
      .eq('user_id', user.id)
      .single()

    if (existingInvoice) {
      return this.updateInvoice(invoice)
    } else {
      return this.createInvoice(invoice)
    }
  },

  async createInvoice(invoice: Invoice): Promise<Invoice> {
    const user = await this.getCachedUser()
    if (!user) throw new Error('User not authenticated')

    const invoiceInsert: InvoiceInsert = {
      id: invoice.id,
      user_id: user.id,
      invoice_number: invoice.invoiceNumber,
      date: invoice.date,
      due_date: invoice.dueDate,
      status: invoice.status,
      client_name: invoice.client.name,
      client_email: invoice.client.email,
      client_address: invoice.client.address,
      client_phone: invoice.client.phone,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      notes: invoice.notes,
      mode: invoice.mode,
    }

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceInsert)
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      throw invoiceError
    }

    // Insert invoice items
    if (invoice.items.length > 0) {
      const itemsInsert: InvoiceItemInsert[] = invoice.items.map(item => ({
        id: item.id,
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsInsert)

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError)
        throw itemsError
      }
    }

    return this.getInvoiceById(invoice.id) as Promise<Invoice>
  },

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    const user = await this.getCachedUser()
    if (!user) throw new Error('User not authenticated')

    const invoiceUpdate: InvoiceUpdate = {
      invoice_number: invoice.invoiceNumber,
      date: invoice.date,
      due_date: invoice.dueDate,
      status: invoice.status,
      client_name: invoice.client.name,
      client_email: invoice.client.email,
      client_address: invoice.client.address,
      client_phone: invoice.client.phone,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      notes: invoice.notes,
      mode: invoice.mode,
    }

    const { error: invoiceError } = await supabase
      .from('invoices')
      .update(invoiceUpdate)
      .eq('id', invoice.id)
      .eq('user_id', user.id)

    if (invoiceError) {
      console.error('Error updating invoice:', invoiceError)
      throw invoiceError
    }

    // Delete existing items and insert new ones
    await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoice.id)

    if (invoice.items.length > 0) {
      const itemsInsert: InvoiceItemInsert[] = invoice.items.map(item => ({
        id: item.id,
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsInsert)

      if (itemsError) {
        console.error('Error updating invoice items:', itemsError)
        throw itemsError
      }
    }

    return this.getInvoiceById(invoice.id) as Promise<Invoice>
  },

  async deleteInvoice(id: string): Promise<void> {
    const user = await this.getCachedUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting invoice:', error)
      throw error
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const user = await this.getCachedUser()
    if (!user) {
      return {
        totalInvoices: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueInvoices: 0,
      }
    }

    // Use Supabase aggregation functions for better performance
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('status, total')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalInvoices: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueInvoices: 0,
      }
    }

    const stats = invoices.reduce(
      (acc, invoice) => {
        acc.totalInvoices++
        if (invoice.status === 'paid') {
          acc.paidAmount += Number(invoice.total)
        } else if (invoice.status === 'overdue') {
          acc.overdueInvoices++
          acc.pendingAmount += Number(invoice.total)
        } else {
          acc.pendingAmount += Number(invoice.total)
        }
        return acc
      },
      {
        totalInvoices: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueInvoices: 0,
      }
    )

    return stats
  },

  // Combined method to fetch dashboard data in one call
  async getDashboardData(): Promise<{invoices: Invoice[], stats: DashboardStats}> {
    const user = await this.getCachedUser()
    if (!user) {
      return {
        invoices: [],
        stats: {
          totalInvoices: 0,
          pendingAmount: 0,
          paidAmount: 0,
          overdueInvoices: 0,
        }
      }
    }

    const { data: invoicesData, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching dashboard data:', error)
      return {
        invoices: [],
        stats: {
          totalInvoices: 0,
          pendingAmount: 0,
          paidAmount: 0,
          overdueInvoices: 0,
        }
      }
    }

    const invoices = invoicesData.map(this.mapRowToInvoice)
    
    // Calculate stats from the same data
    const stats = invoices.reduce(
      (acc, invoice) => {
        acc.totalInvoices++
        if (invoice.status === 'paid') {
          acc.paidAmount += invoice.total
        } else if (invoice.status === 'overdue') {
          acc.overdueInvoices++
          acc.pendingAmount += invoice.total
        } else {
          acc.pendingAmount += invoice.total
        }
        return acc
      },
      {
        totalInvoices: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueInvoices: 0,
      }
    )

    return { invoices, stats }
  },

  mapRowToInvoice(row: InvoiceRow & { invoice_items: InvoiceItemRow[] }): Invoice {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      date: row.date,
      dueDate: row.due_date,
      status: row.status,
      client: {
        name: row.client_name,
        email: row.client_email,
        address: row.client_address,
        phone: row.client_phone || undefined,
      },
      items: row.invoice_items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.amount),
      })),
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      total: Number(row.total),
      notes: row.notes || undefined,
      createdAt: row.created_at,
      mode: row.mode,
    }
  },

  // Real-time subscription for invoice changes
  subscribeToInvoiceChanges(callback: (payload: any) => void) {
    return supabase
      .channel('invoice_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
        },
        callback
      )
      .subscribe()
  }
}
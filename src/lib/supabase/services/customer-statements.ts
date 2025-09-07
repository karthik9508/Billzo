import { supabase } from '@/lib/supabase/client'
import { 
  Customer, 
  Payment, 
  CustomerStatement, 
  CustomerStatementSummary,
  StatementFilters 
} from '@/types/customer-statements'
import { Database } from '@/types/database'

type CustomerRow = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type PaymentRow = Database['public']['Tables']['payments']['Row']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']
type CustomerStatementRow = Database['public']['Tables']['customer_statements']['Row']
type CustomerStatementInsert = Database['public']['Tables']['customer_statements']['Insert']

export const customerStatementsService = {
  // Cache user for performance
  _cachedUser: null as any,
  _userCacheTime: 0,
  
  async getCachedUser() {
    const now = Date.now()
    if (!this._cachedUser || (now - this._userCacheTime) > 60000) { // Cache for 1 minute
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('🔍 Auth check:', { user: user ? { id: user.id, email: user.email } : null, error: error?.message })
        this._cachedUser = user
        this._userCacheTime = now
      } catch (err) {
        console.error('Auth error in getCachedUser:', err)
        this._cachedUser = null
      }
    }
    return this._cachedUser
  },

  // Customer management
  async getAllCustomers(): Promise<Customer[]> {
    const user = await this.getCachedUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) {
      console.error('Error fetching customers:', error)
      // Check if table doesn't exist
      if (error.code === '42P01') {
        console.warn('Customers table does not exist. Please run database migrations.')
      }
      return []
    }

    return data.map(this.mapRowToCustomer)
  },

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const user = await this.getCachedUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching customer:', error)
      return null
    }

    return this.mapRowToCustomer(data)
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const user = await this.getCachedUser()
    if (!user) throw new Error('User not authenticated')

    const customerInsert: CustomerInsert = {
      user_id: user.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(customerInsert)
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      
      // Check if table doesn't exist
      if (error.code === '42P01') {
        throw new Error('Customer statements feature is not yet available. Database migration required.')
      }
      
      // Check for unique constraint violation (duplicate email)
      if (error.code === '23505') {
        throw new Error('A customer with this email already exists.')
      }
      
      throw new Error(error.message || 'Failed to create customer')
    }

    return this.mapRowToCustomer(data)
  },

  // Payment management
  async getCustomerPayments(customerId: string): Promise<Payment[]> {
    const user = await this.getCachedUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('customer_id', customerId)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return []
    }

    return data.map(this.mapRowToPayment)
  },

  async addPayment(payment: Omit<Payment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const user = await this.getCachedUser()
    if (!user) throw new Error('User not authenticated')

    const paymentInsert: PaymentInsert = {
      user_id: user.id,
      invoice_id: payment.invoiceId,
      customer_id: payment.customerId,
      amount: payment.amount,
      payment_date: payment.paymentDate,
      payment_method: payment.paymentMethod,
      reference_number: payment.referenceNumber,
      notes: payment.notes,
    }

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentInsert)
      .select()
      .single()

    if (error) {
      console.error('Error adding payment:', error)
      throw error
    }

    return this.mapRowToPayment(data)
  },

  // Customer statement generation
  async generateCustomerStatement(
    customerEmail: string, 
    fromDate?: string, 
    toDate?: string
  ): Promise<CustomerStatementSummary> {
    const user = await this.getCachedUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .rpc('calculate_customer_statement', {
        p_user_id: user.id,
        p_customer_email: customerEmail,
        p_from_date: fromDate || null,
        p_to_date: toDate || null
      })

    if (error) {
      console.error('Error generating customer statement:', error)
      throw error
    }

    if (!data || data.length === 0) {
      throw new Error('No data found for customer')
    }

    const statementData = data[0]
    return {
      customerName: statementData.customer_name,
      customerEmail: statementData.customer_email,
      customerPhone: statementData.customer_phone,
      customerAddress: statementData.customer_address,
      totalSales: Number(statementData.total_sales),
      totalPayments: Number(statementData.total_payments),
      outstandingBalance: Number(statementData.outstanding_balance),
      invoiceCount: statementData.invoice_count,
      paymentCount: statementData.payment_count,
    }
  },

  async saveCustomerStatement(statement: Omit<CustomerStatement, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<CustomerStatement> {
    const user = await this.getCachedUser()
    if (!user) throw new Error('User not authenticated')

    const statementInsert: CustomerStatementInsert = {
      user_id: user.id,
      customer_id: statement.customerId,
      statement_number: statement.statementNumber,
      from_date: statement.fromDate,
      to_date: statement.toDate,
      total_sales: statement.totalSales,
      total_payments: statement.totalPayments,
      outstanding_balance: statement.outstandingBalance,
      status: statement.status,
      sent_via: statement.sentVia,
      sent_at: statement.sentAt,
    }

    const { data, error } = await supabase
      .from('customer_statements')
      .insert(statementInsert)
      .select()
      .single()

    if (error) {
      console.error('Error saving customer statement:', error)
      throw error
    }

    return this.mapRowToCustomerStatement(data)
  },

  async getAllStatements(filters?: StatementFilters): Promise<CustomerStatement[]> {
    const user = await this.getCachedUser()
    if (!user) return []

    let query = supabase
      .from('customer_statements')
      .select(`
        *,
        customers (*)
      `)
      .eq('user_id', user.id)

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.fromDate) {
      query = query.gte('from_date', filters.fromDate)
    }
    if (filters?.toDate) {
      query = query.lte('to_date', filters.toDate)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customer statements:', error)
      return []
    }

    return data.map(row => this.mapRowToCustomerStatement(row))
  },

  async markStatementAsSent(statementId: string, sentVia: 'email' | 'whatsapp' | 'manual'): Promise<void> {
    const user = await this.getCachedUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('customer_statements')
      .update({
        status: 'sent',
        sent_via: sentVia,
        sent_at: new Date().toISOString(),
      })
      .eq('id', statementId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating statement status:', error)
      throw error
    }
  },

  // Helper methods
  mapRowToCustomer(row: CustomerRow): Customer {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      address: row.address || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  },

  mapRowToPayment(row: PaymentRow): Payment {
    return {
      id: row.id,
      userId: row.user_id,
      invoiceId: row.invoice_id || undefined,
      customerId: row.customer_id,
      amount: Number(row.amount),
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      referenceNumber: row.reference_number || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  },

  mapRowToCustomerStatement(row: CustomerStatementRow & { customers?: CustomerRow }): CustomerStatement {
    return {
      id: row.id,
      userId: row.user_id,
      customerId: row.customer_id,
      statementNumber: row.statement_number,
      fromDate: row.from_date,
      toDate: row.to_date,
      totalSales: Number(row.total_sales),
      totalPayments: Number(row.total_payments),
      outstandingBalance: Number(row.outstanding_balance),
      status: row.status,
      sentVia: row.sent_via || undefined,
      sentAt: row.sent_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      customer: row.customers ? this.mapRowToCustomer(row.customers) : undefined,
    }
  },
}
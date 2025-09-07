import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StatementFilters } from '@/types/customer-statements'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Customer Statements GET API: Starting request...')
    const { searchParams } = new URL(request.url)
    
    // Use server-side Supabase client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message || 'No user')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ User authenticated:', { id: user.id, email: user.email })
    
    // Build query with filters
    let query = supabase
      .from('customer_statements')
      .select(`
        *,
        customers (*)
      `)
      .eq('user_id', user.id)

    if (searchParams.get('customerId')) {
      query = query.eq('customer_id', searchParams.get('customerId')!)
    }
    if (searchParams.get('status')) {
      query = query.eq('status', searchParams.get('status')!)
    }
    if (searchParams.get('fromDate')) {
      query = query.gte('from_date', searchParams.get('fromDate')!)
    }
    if (searchParams.get('toDate')) {
      query = query.lte('to_date', searchParams.get('toDate')!)
    }

    const { data: statements, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('🚨 Error fetching statements:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customer statements', details: error.message },
        { status: 500 }
      )
    }

    // Map database rows to frontend format
    const mappedStatements = statements.map(row => ({
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
      customer: row.customers ? {
        id: row.customers.id,
        userId: row.customers.user_id,
        name: row.customers.name,
        email: row.customers.email,
        phone: row.customers.phone || undefined,
        address: row.customers.address || undefined,
        createdAt: row.customers.created_at,
        updatedAt: row.customers.updated_at,
      } : undefined,
    }))

    console.log('✅ Statements fetched successfully:', mappedStatements.length)
    return NextResponse.json(mappedStatements)
  } catch (error) {
    console.error('🚨 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer statements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Customer Statements POST API: Starting request...')
    const body = await request.json()
    const { customerId, fromDate, toDate, statementNumber } = body
    console.log('📝 Request data:', { customerId, statementNumber, fromDate, toDate })

    if (!customerId || !statementNumber) {
      console.log('❌ Validation failed: Missing customerId or statementNumber')
      return NextResponse.json(
        { error: 'Customer ID and statement number are required' },
        { status: 400 }
      )
    }

    // Use server-side Supabase client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message || 'No user')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ User authenticated:', { id: user.id, email: user.email })

    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', customerId)
      .single()
    
    if (customerError || !customer) {
      console.error('🚨 Customer lookup error:', customerError)
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    console.log('✅ Customer found:', { id: customer.id, name: customer.name, email: customer.email })

    // Set default dates
    const defaultFromDate = fromDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const defaultToDate = toDate || new Date().toISOString().split('T')[0]

    // Get payments for this customer
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('user_id', user.id)
      .eq('customer_id', customerId)
      .gte('payment_date', defaultFromDate)
      .lte('payment_date', defaultToDate)

    if (paymentsError) {
      console.error('🚨 Payments lookup error:', paymentsError)
    }

    const totalPayments = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0
    const paymentCount = paymentsData?.length || 0

    // For now, we don't have invoices integration, so sales are 0
    const totalSales = 0
    const outstandingBalance = totalSales - totalPayments

    console.log('💰 Financial data:', { totalSales, totalPayments, outstandingBalance, paymentCount })

    // Save the customer statement
    const { data: statement, error: saveError } = await supabase
      .from('customer_statements')
      .insert([{
        user_id: user.id,
        customer_id: customerId,
        statement_number: statementNumber,
        from_date: defaultFromDate,
        to_date: defaultToDate,
        total_sales: totalSales,
        total_payments: totalPayments,
        outstanding_balance: outstandingBalance,
        status: 'draft',
      }])
      .select()
      .single()

    if (saveError) {
      console.error('🚨 Error saving statement:', saveError)
      
      // Handle specific errors
      if (saveError.code === '23505') {
        return NextResponse.json(
          { error: 'A statement with this number already exists' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to save customer statement', details: saveError.message },
        { status: 500 }
      )
    }

    // Map the saved statement to frontend format
    const mappedStatement = {
      id: statement.id,
      userId: statement.user_id,
      customerId: statement.customer_id,
      statementNumber: statement.statement_number,
      fromDate: statement.from_date,
      toDate: statement.to_date,
      totalSales: Number(statement.total_sales),
      totalPayments: Number(statement.total_payments),
      outstandingBalance: Number(statement.outstanding_balance),
      status: statement.status,
      sentVia: statement.sent_via || undefined,
      sentAt: statement.sent_at || undefined,
      createdAt: statement.created_at,
      updatedAt: statement.updated_at,
      customer: {
        id: customer.id,
        userId: customer.user_id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || undefined,
        address: customer.address || undefined,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
      }
    }

    const statementData = {
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      totalSales,
      totalPayments,
      outstandingBalance,
      invoiceCount: 0,
      paymentCount,
    }

    console.log('✅ Statement created successfully:', mappedStatement)
    return NextResponse.json({
      statement: mappedStatement,
      statementData
    })
  } catch (error) {
    console.error('🚨 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer statement', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
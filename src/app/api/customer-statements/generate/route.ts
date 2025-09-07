import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Generate Statement API: Starting request...')
    const body = await request.json()
    const { customerEmail, fromDate, toDate } = body
    console.log('📝 Request data:', { customerEmail, fromDate, toDate })

    if (!customerEmail) {
      console.log('❌ Validation failed: Missing customer email')
      return NextResponse.json(
        { error: 'Customer email is required' },
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

    // Set default dates if not provided
    const defaultFromDate = fromDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const defaultToDate = toDate || new Date().toISOString().split('T')[0]

    console.log('📅 Date range:', { from: defaultFromDate, to: defaultToDate })

    // Try to call the database function first
    const { data, error } = await supabase.rpc('calculate_customer_statement', {
      p_user_id: user.id,
      p_customer_email: customerEmail,
      p_from_date: defaultFromDate,
      p_to_date: defaultToDate
    })

    let result;

    if (error && (error.code === 'PGRST202' || error.message.includes('Could not find the function'))) {
      console.log('⚠️ Database function not found, using fallback logic')
      
      // Fallback: Calculate manually without the function
      // Get customer info
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .eq('email', customerEmail)
        .single()

      if (customerError && customerError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('🚨 Customer lookup error:', customerError)
        return NextResponse.json(
          { error: 'Failed to lookup customer', details: customerError.message },
          { status: 500 }
        )
      }

      // Get payments for this customer
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', user.id)
        .eq('customer_id', customerData?.id || '00000000-0000-0000-0000-000000000000')
        .gte('payment_date', defaultFromDate)
        .lte('payment_date', defaultToDate)

      if (paymentsError) {
        console.error('🚨 Payments lookup error:', paymentsError)
      }

      const totalPayments = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0
      const paymentCount = paymentsData?.length || 0

      result = {
        customerName: customerData?.name || 'Unknown Customer',
        customerEmail: customerEmail,
        customerPhone: customerData?.phone || null,
        customerAddress: customerData?.address || null,
        totalSales: 0, // No invoices table integration yet
        totalPayments: totalPayments,
        outstandingBalance: 0 - totalPayments, // Negative if payments exceed sales
        invoiceCount: 0, // No invoices table integration yet
        paymentCount: paymentCount,
      }

      console.log('✅ Fallback calculation completed:', result)
      
    } else if (error) {
      console.error('🚨 Database function error:', error)
      return NextResponse.json(
        { error: 'Failed to calculate customer statement', details: error.message },
        { status: 500 }
      )
    } else {
      // Function worked, use its results
      if (!data || data.length === 0) {
        console.log('⚠️ No data found for customer:', customerEmail)
        return NextResponse.json(
          { error: 'No data found for this customer' },
          { status: 404 }
        )
      }

      const statementData = data[0]
      result = {
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

      console.log('✅ Database function calculation completed:', result)
    }

    console.log('✅ Statement generated successfully:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('🚨 Unexpected error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate customer statement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
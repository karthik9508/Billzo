import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    console.log('🔍 Debug: Checking Supabase connection...')
    
    // Test basic connection
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('User:', user ? 'Authenticated' : 'Not authenticated')
    console.log('User Error:', userError)
    
    // Test customers table existence
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1)
    
    console.log('Customers query result:', { data: customers, error: customersError })
    
    // Test other tables
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1)
    
    console.log('Invoices query result:', { data: invoices, error: invoicesError })
    
    return NextResponse.json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      user: user ? { id: user.id, email: user.email } : null,
      userError: userError?.message,
      customersTable: {
        exists: !customersError,
        error: customersError?.message,
        errorCode: customersError?.code,
        data: customers?.length || 0
      },
      invoicesTable: {
        exists: !invoicesError,
        error: invoicesError?.message,
        data: invoices?.length || 0
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    // Map database rows to frontend format
    const mappedCustomers = customers.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      address: row.address || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json(mappedCustomers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Customer API: Starting request...')
    const body = await request.json()
    const { name, email, phone, address } = body
    console.log('📝 Request data:', { name, email, phone, address })

    if (!name || !email) {
      console.log('❌ Validation failed: Missing name or email')
      return NextResponse.json(
        { error: 'Name and email are required' },
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

    // Create customer using server-side client
    const { data: customer, error } = await supabase
      .from('customers')
      .insert([{
        user_id: user.id,
        name,
        email,
        phone,
        address
      }])
      .select()
      .single()

    if (error) {
      console.error('🚨 Error creating customer:', error)
      
      // Handle specific errors
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A customer with this email already exists' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create customer', details: error.message },
        { status: 500 }
      )
    }

    // Map database row to frontend format
    const mappedCustomer = {
      id: customer.id,
      userId: customer.user_id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || undefined,
      address: customer.address || undefined,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    }

    console.log('✅ Customer created successfully:', mappedCustomer)
    return NextResponse.json(mappedCustomer)
  } catch (error) {
    console.error('🚨 Unexpected error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create customer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
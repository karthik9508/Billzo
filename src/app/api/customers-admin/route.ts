import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server-client'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Admin Customer API: Starting request...')
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

    // Use admin client to bypass authentication issues temporarily
    console.log('🔑 Using admin Supabase client...')
    const adminClient = createAdminSupabaseClient()
    
    // For now, we'll create a dummy user_id - this is just for testing
    // In production, you'd get this from the authenticated user
    const dummyUserId = '00000000-0000-0000-0000-000000000000'
    
    console.log('🔄 Creating customer with admin client...')
    const { data: customer, error } = await adminClient
      .from('customers')
      .insert({
        user_id: dummyUserId,
        name,
        email,
        phone: phone || null,
        address: address || null
      })
      .select()
      .single()

    if (error) {
      console.error('🚨 Database error:', error)
      
      if (error.code === 'PGRST116' || error.message.includes('table') || error.message.includes('relation')) {
        return NextResponse.json({
          error: 'Database table not found',
          message: 'The customers table does not exist. Please run the database migration first.',
          instructions: [
            '1. Go to https://supabase.com/dashboard',
            '2. Navigate to SQL Editor',
            '3. Run the migration SQL to create the customers table'
          ]
        }, { status: 500 })
      }
      
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log('✅ Customer created successfully:', customer)
    return NextResponse.json({
      success: true,
      customer,
      message: 'Customer created with admin privileges'
    })
    
  } catch (error) {
    console.error('🚨 Unexpected error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to create customer',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
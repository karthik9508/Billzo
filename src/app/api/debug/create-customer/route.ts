import { NextRequest, NextResponse } from 'next/server'
import { customerStatementsService } from '@/lib/supabase/services/customer-statements'
import { supabase } from '@/lib/supabase/client'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Starting customer creation debug...')
    
    const body = await request.json()
    console.log('📝 Request body:', body)
    
    // Test 1: Check if table exists with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🔑 Testing with service role...')
    const { data: serviceTest, error: serviceError } = await adminClient
      .from('customers')
      .select('*')
      .limit(1)
    
    console.log('Service role test:', { data: serviceTest, error: serviceError })
    
    // Test 2: Check user authentication
    console.log('👤 Checking user authentication...')
    const user = await customerStatementsService.getCachedUser()
    console.log('User from service:', user ? { id: user.id, email: user.email } : 'No user')
    
    // Test 3: Try to create customer with service role (bypass RLS)
    if (user) {
      console.log('🧪 Testing customer creation with service role...')
      try {
        const { data: createTest, error: createError } = await adminClient
          .from('customers')
          .insert({
            user_id: user.id,
            name: body.name || 'Test Customer',
            email: body.email || 'test@example.com',
            phone: body.phone || null,
            address: body.address || null
          })
          .select()
          .single()
        
        console.log('Service role create test:', { data: createTest, error: createError })
        
        if (!createError && createTest) {
          return NextResponse.json({
            success: true,
            message: 'Customer created successfully with service role!',
            customer: createTest,
            debugInfo: {
              tableExists: true,
              userAuthenticated: true,
              serviceRoleWorks: true
            }
          })
        }
      } catch (createErr) {
        console.error('Service role create error:', createErr)
      }
    }
    
    // Test 4: Try the original service method
    console.log('🔄 Testing original service method...')
    try {
      const customer = await customerStatementsService.createCustomer({
        name: body.name || 'Test Customer',
        email: body.email || 'test@example.com',
        phone: body.phone || null,
        address: body.address || null
      })
      
      return NextResponse.json({
        success: true,
        message: 'Customer created with original service!',
        customer,
        debugInfo: {
          tableExists: true,
          userAuthenticated: !!user,
          originalServiceWorks: true
        }
      })
    } catch (serviceErr) {
      console.error('Original service error:', serviceErr)
      
      return NextResponse.json({
        success: false,
        error: serviceErr instanceof Error ? serviceErr.message : 'Service error',
        debugInfo: {
          tableExists: !serviceError,
          userAuthenticated: !!user,
          serviceRoleWorks: !serviceError,
          originalServiceError: serviceErr instanceof Error ? serviceErr.message : 'Unknown error',
          detailedError: serviceErr
        }
      })
    }
    
  } catch (error) {
    console.error('🚨 Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown debug error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Simple SQL to create customers table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, email)
      );
      
      ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view own customers" ON public.customers
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can insert own customers" ON public.customers
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can update own customers" ON public.customers
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can delete own customers" ON public.customers
        FOR DELETE USING (auth.uid() = user_id);
    `

    console.log('🚀 Attempting to create customers table...')
    
    // Try to execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      console.error('Migration error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        instructions: [
          'The automated migration failed.',
          'Please run the SQL manually in your Supabase dashboard:',
          '1. Go to https://supabase.com/dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the SQL from the response',
          '4. Click Run'
        ],
        sql: createTableSQL
      })
    }
    
    // Test if table was created
    const { data, error: testError } = await supabase
      .from('customers')
      .select('*')
      .limit(1)
    
    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Table creation might have failed: ' + testError.message,
        sql: createTableSQL
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Customers table created successfully!',
      tableTest: 'Passed'
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    )
  }
}
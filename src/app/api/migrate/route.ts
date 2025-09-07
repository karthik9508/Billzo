import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🔍 Starting database migration...')

    // Create customers table
    const createCustomersTable = `
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
    `

    // Create payments table
    const createPaymentsTable = `
      CREATE TABLE IF NOT EXISTS public.payments (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          invoice_id UUID,
          customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
          amount NUMERIC NOT NULL,
          payment_date DATE NOT NULL,
          payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'card', 'other')),
          reference_number TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // Create customer_statements table
    const createCustomerStatementsTable = `
      CREATE TABLE IF NOT EXISTS public.customer_statements (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
          statement_number TEXT NOT NULL,
          from_date DATE NOT NULL,
          to_date DATE NOT NULL,
          total_sales NUMERIC NOT NULL DEFAULT 0,
          total_payments NUMERIC NOT NULL DEFAULT 0,
          outstanding_balance NUMERIC NOT NULL DEFAULT 0,
          status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
          sent_via TEXT CHECK (sent_via IN ('email', 'whatsapp', 'manual')),
          sent_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, statement_number)
      );
    `

    // Enable RLS
    const enableRLS = `
      ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.customer_statements ENABLE ROW LEVEL SECURITY;
    `

    // Create RLS policies for customers
    const createCustomerPolicies = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can view own customers') THEN
          CREATE POLICY "Users can view own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can update own customers') THEN
          CREATE POLICY "Users can update own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can insert own customers') THEN
          CREATE POLICY "Users can insert own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can delete own customers') THEN
          CREATE POLICY "Users can delete own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id);
        END IF;
      END $$;
    `

    // Execute the SQL commands one by one
    const commands = [
      { name: 'Create customers table', sql: createCustomersTable },
      { name: 'Create payments table', sql: createPaymentsTable },
      { name: 'Create customer statements table', sql: createCustomerStatementsTable },
      { name: 'Enable RLS', sql: enableRLS },
      { name: 'Create customer policies', sql: createCustomerPolicies }
    ]

    const results = []

    for (const command of commands) {
      try {
        console.log(`📝 Executing: ${command.name}`)
        
        // Use raw SQL query
        const { data, error } = await supabase.rpc('exec', { sql: command.sql })
        
        if (error) {
          console.log(`❌ ${command.name} failed:`, error)
          results.push({ command: command.name, success: false, error: error.message })
        } else {
          console.log(`✅ ${command.name} completed`)
          results.push({ command: command.name, success: true })
        }
      } catch (err) {
        console.log(`🚨 ${command.name} error:`, err)
        results.push({ command: command.name, success: false, error: String(err) })
      }
    }

    // Test if customers table is now accessible
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .limit(1)

      if (error) {
        console.log('❌ Post-migration test failed:', error)
        return NextResponse.json({
          success: false,
          message: 'Migration completed but table test failed',
          results,
          testError: error
        })
      }

      console.log('✅ Migration completed successfully!')
      return NextResponse.json({
        success: true,
        message: 'Database migration completed successfully',
        results
      })
    } catch (testErr) {
      console.log('🚨 Post-migration test error:', testErr)
      return NextResponse.json({
        success: false,
        message: 'Migration completed but verification failed',
        results,
        testError: String(testErr)
      })
    }

  } catch (error) {
    console.error('🚨 Migration failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
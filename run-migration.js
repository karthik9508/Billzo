const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Make sure .env.local has:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_key')
  process.exit(1)
}

console.log('🔧 Creating Supabase client with service role...')
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Starting customer statements migration...')

  const statements = [
    // Enable UUID extension
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    
    // Create customers table
    `CREATE TABLE IF NOT EXISTS public.customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, email)
    );`,
    
    // Enable RLS on customers
    `ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;`,
    
    // Create RLS policies for customers
    `CREATE POLICY IF NOT EXISTS "Users can view own customers" ON public.customers
      FOR SELECT USING (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can insert own customers" ON public.customers
      FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can update own customers" ON public.customers
      FOR UPDATE USING (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can delete own customers" ON public.customers
      FOR DELETE USING (auth.uid() = user_id);`,
    
    // Create updated_at function if it doesn't exist
    `CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`,
    
    // Create trigger for customers updated_at
    `CREATE TRIGGER IF NOT EXISTS handle_customers_updated_at
      BEFORE UPDATE ON public.customers
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();`,
    
    // Create function to sync customers from invoices
    `CREATE OR REPLACE FUNCTION public.sync_customer_from_invoice()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO public.customers (user_id, name, email, phone, address)
        VALUES (NEW.user_id, NEW.client_name, NEW.client_email, NEW.client_phone, NEW.client_address)
        ON CONFLICT (user_id, email) 
        DO UPDATE SET 
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            address = EXCLUDED.address,
            updated_at = NOW();
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`,
    
    // Create trigger to sync customers from invoices
    `DROP TRIGGER IF EXISTS sync_customer_from_invoice ON public.invoices;`,
    
    `CREATE TRIGGER sync_customer_from_invoice
      AFTER INSERT OR UPDATE ON public.invoices
      FOR EACH ROW EXECUTE PROCEDURE public.sync_customer_from_invoice();`
  ]

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    console.log(`📝 Executing statement ${i + 1}/${statements.length}...`)
    
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: statement 
      })
      
      if (error) {
        console.log(`⚠️  Warning on statement ${i + 1}: ${error.message}`)
      } else {
        console.log(`✅ Statement ${i + 1} completed successfully`)
      }
    } catch (err) {
      // Try direct query approach
      try {
        const { error } = await supabase
          .from('_temp_migration')
          .select('1')
          
        // This will fail, but let's try a different approach
        console.log(`🔄 Trying alternative approach for statement ${i + 1}...`)
        
        // Let's try using the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: statement })
        })
        
        if (response.ok) {
          console.log(`✅ Statement ${i + 1} completed via REST API`)
        } else {
          console.log(`⚠️  Could not execute statement ${i + 1}: ${response.statusText}`)
        }
      } catch (restErr) {
        console.log(`⚠️  Could not execute statement ${i + 1}: ${err.message}`)
      }
    }
  }

  // Test the customers table
  console.log('🧪 Testing customers table...')
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Customers table test failed:', error.message)
    } else {
      console.log('✅ Customers table is working!')
    }
  } catch (err) {
    console.log('❌ Could not test customers table:', err.message)
  }

  console.log('🎉 Migration completed!')
  console.log('')
  console.log('If the migration failed, please:')
  console.log('1. Go to https://supabase.com/dashboard')
  console.log('2. Navigate to your project → SQL Editor')
  console.log('3. Copy and paste the SQL from create-customers-table.sql')
  console.log('4. Run the SQL manually')
}

runMigration().catch(console.error)
# 🚀 Database Migration Instructions

## Quick Fix for "Failed to create customer" Error

The error occurs because the `customers` table doesn't exist in your Supabase database. Here's how to fix it:

### **Step 1: Open Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Click on your project (`uueachjukaprxoaonhuo`)
3. Navigate to **SQL Editor** in the left sidebar

### **Step 2: Copy and Paste SQL**
Copy this entire SQL block and paste it in the SQL Editor:

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create customers table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(user_id, email);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY IF NOT EXISTS "Users can view own customers" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own customers" ON public.customers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own customers" ON public.customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own customers" ON public.customers
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customers updated_at
DROP TRIGGER IF EXISTS handle_customers_updated_at ON public.customers;
CREATE TRIGGER handle_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to automatically create/update customer from invoice
CREATE OR REPLACE FUNCTION public.sync_customer_from_invoice()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update customer from invoice data
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
$$ LANGUAGE plpgsql;

-- Create trigger to sync customers when invoices are created/updated
DROP TRIGGER IF EXISTS sync_customer_from_invoice ON public.invoices;
CREATE TRIGGER sync_customer_from_invoice
    AFTER INSERT OR UPDATE ON public.invoices
    FOR EACH ROW EXECUTE PROCEDURE public.sync_customer_from_invoice();
```

### **Step 3: Run the SQL**
1. Click the **"Run"** button in the SQL Editor
2. Wait for the green success message

### **Step 4: Test the Fix**
1. Go back to your app: http://localhost:3002/customer-statements/customers
2. Try creating a customer again
3. The error should be gone! ✅

## Alternative: Use the App Helper

If you prefer, you can also:
1. Go to http://localhost:3002/customer-statements/customers
2. Try creating a customer (it will show the migration warning)
3. Click "📋 Copy Migration SQL" 
4. The SQL will be copied to your clipboard
5. Paste it in Supabase SQL Editor and run it

## What This Migration Does

- ✅ Creates the `customers` table to store customer information
- ✅ Sets up Row Level Security (RLS) so users only see their own customers
- ✅ Creates indexes for better performance
- ✅ Adds triggers to automatically sync customers from invoices
- ✅ Sets up proper foreign key relationships

After running this migration, you'll be able to:
- ✅ Create customers
- ✅ Generate customer statements  
- ✅ Track payments
- ✅ Send statements via WhatsApp

The migration is **safe to run multiple times** - it uses `IF NOT EXISTS` clauses.
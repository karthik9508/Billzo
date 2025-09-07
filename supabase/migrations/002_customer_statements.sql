-- Add customer statements functionality

-- Create customers table to aggregate client data
CREATE TABLE public.customers (
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

-- Create payments table to track payments received
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'card', 'other')),
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customer_statements table for generated statements
CREATE TABLE public.customer_statements (
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

-- Create indexes for better performance
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_email ON public.customers(user_id, email);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date);
CREATE INDEX idx_customer_statements_user_id ON public.customer_statements(user_id);
CREATE INDEX idx_customer_statements_customer_id ON public.customer_statements(customer_id);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_statements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Users can view own customers" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" ON public.customers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers" ON public.customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" ON public.customers
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for payments
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments" ON public.payments
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for customer_statements
CREATE POLICY "Users can view own customer statements" ON public.customer_statements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own customer statements" ON public.customer_statements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customer statements" ON public.customer_statements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customer statements" ON public.customer_statements
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.customer_statements
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to automatically create/update customer from invoice
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
CREATE TRIGGER sync_customer_from_invoice
    AFTER INSERT OR UPDATE ON public.invoices
    FOR EACH ROW EXECUTE PROCEDURE public.sync_customer_from_invoice();

-- Function to calculate customer statement data
CREATE OR REPLACE FUNCTION public.calculate_customer_statement(
    p_user_id UUID,
    p_customer_email TEXT,
    p_from_date DATE DEFAULT NULL,
    p_to_date DATE DEFAULT NULL
)
RETURNS TABLE(
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    total_sales NUMERIC,
    total_payments NUMERIC,
    outstanding_balance NUMERIC,
    invoice_count INTEGER,
    payment_count INTEGER
) AS $$
BEGIN
    -- Set default date range if not provided (last 90 days)
    IF p_from_date IS NULL THEN
        p_from_date := CURRENT_DATE - INTERVAL '90 days';
    END IF;
    
    IF p_to_date IS NULL THEN
        p_to_date := CURRENT_DATE;
    END IF;

    RETURN QUERY
    WITH customer_info AS (
        SELECT DISTINCT
            i.client_name,
            i.client_email,
            i.client_phone,
            i.client_address
        FROM invoices i
        WHERE i.user_id = p_user_id
        AND i.client_email = p_customer_email
        ORDER BY i.created_at DESC
        LIMIT 1
    ),
    sales_data AS (
        SELECT 
            COALESCE(SUM(i.total), 0) as sales_total,
            COUNT(i.id) as invoice_count
        FROM invoices i
        WHERE i.user_id = p_user_id
        AND i.client_email = p_customer_email
        AND i.date BETWEEN p_from_date AND p_to_date
    ),
    payments_data AS (
        SELECT 
            COALESCE(SUM(p.amount), 0) as payments_total,
            COUNT(p.id) as payment_count
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        WHERE p.user_id = p_user_id
        AND c.email = p_customer_email
        AND p.payment_date BETWEEN p_from_date AND p_to_date
    )
    SELECT 
        ci.client_name,
        ci.client_email,
        ci.client_phone,
        ci.client_address,
        sd.sales_total,
        pd.payments_total,
        (sd.sales_total - pd.payments_total) as outstanding,
        sd.invoice_count::INTEGER,
        pd.payment_count::INTEGER
    FROM customer_info ci
    CROSS JOIN sales_data sd
    CROSS JOIN payments_data pd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
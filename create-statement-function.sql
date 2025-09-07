-- Simplified function to calculate customer statement data
-- Works even if invoices table doesn't exist yet
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
        -- Get customer info from customers table
        SELECT 
            c.name as customer_name,
            c.email as customer_email,
            c.phone as customer_phone,
            c.address as customer_address
        FROM customers c
        WHERE c.user_id = p_user_id
        AND c.email = p_customer_email
        LIMIT 1
    ),
    sales_data AS (
        -- Check if invoices table exists and calculate sales
        SELECT 
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
                    COALESCE((
                        SELECT SUM(i.total) 
                        FROM invoices i 
                        WHERE i.user_id = p_user_id 
                        AND i.client_email = p_customer_email 
                        AND i.date BETWEEN p_from_date AND p_to_date
                    ), 0)
                ELSE 0
            END as sales_total,
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
                    COALESCE((
                        SELECT COUNT(i.id) 
                        FROM invoices i 
                        WHERE i.user_id = p_user_id 
                        AND i.client_email = p_customer_email 
                        AND i.date BETWEEN p_from_date AND p_to_date
                    ), 0)
                ELSE 0
            END as invoice_count
    ),
    payments_data AS (
        -- Calculate payments from payments table
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
        COALESCE(ci.customer_name, 'Unknown Customer'),
        p_customer_email,
        ci.customer_phone,
        ci.customer_address,
        sd.sales_total,
        pd.payments_total,
        (sd.sales_total - pd.payments_total) as outstanding,
        sd.invoice_count::INTEGER,
        pd.payment_count::INTEGER
    FROM customer_info ci
    CROSS JOIN sales_data sd
    CROSS JOIN payments_data pd
    
    UNION ALL
    
    -- If no customer found, return default values
    SELECT 
        'Unknown Customer',
        p_customer_email,
        NULL::TEXT,
        NULL::TEXT,
        0::NUMERIC,
        0::NUMERIC,
        0::NUMERIC,
        0::INTEGER,
        0::INTEGER
    WHERE NOT EXISTS (SELECT 1 FROM customers WHERE user_id = p_user_id AND email = p_customer_email)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
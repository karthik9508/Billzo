# Customer Statements Feature

## Overview
This feature adds comprehensive customer statements functionality to the invoice generator app, including payment tracking, statement generation, and WhatsApp integration for sending statements.

## Features Added

### 1. Database Schema
- **customers table**: Stores customer information (name, email, phone, address)
- **payments table**: Tracks all payments received from customers
- **customer_statements table**: Stores generated statements with totals and status
- **calculate_customer_statement function**: Database function to calculate statement totals

### 2. API Endpoints
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/payments?customerId=<id>` - Get customer payments
- `POST /api/payments` - Add new payment
- `GET /api/customer-statements` - List statements with filtering
- `POST /api/customer-statements` - Generate new statement
- `POST /api/customer-statements/generate` - Preview statement data
- `PATCH /api/customer-statements/[id]` - Update statement status
- `POST /api/whatsapp/send-statement` - Send statement via WhatsApp

### 3. User Interface Pages
- `/customer-statements` - Main statements dashboard
- `/customer-statements/new` - Generate new statement
- `/customer-statements/customers` - Customer management
- `/customer-statements/[id]/send` - Send statement via various methods

### 4. Key Components
- Customer selection and filtering
- Statement preview with financial summary
- Payment tracking and recording
- WhatsApp integration for sending
- Email and manual sending options

## Statement Features

### Financial Summary
Each statement includes:
- **Total Sales**: Sum of all invoices for the period
- **Payments Received**: Sum of all payments for the period  
- **Outstanding Balance**: Total sales minus payments received
- **Invoice Count**: Number of invoices in the period
- **Payment Count**: Number of payments in the period

### Sending Options
1. **WhatsApp**: Send formatted message with statement summary
2. **Email**: Mark as sent via email (integration placeholder)
3. **Manual**: Mark as sent for printed/in-person delivery

### WhatsApp Integration
- Automatic message formatting with customer name and financial summary
- Phone number validation and formatting
- Statement status tracking (draft/sent)
- Delivery method tracking

## Database Migration

To apply the new database schema, run the migration:

```sql
-- The migration file is located at:
-- supabase/migrations/002_customer_statements.sql
```

## Navigation
- Added "Customer Statements" to the main sidebar navigation
- Accessible from dashboard with statement generation and management links

## Payment Methods Supported
- Cash
- Check  
- Bank Transfer
- Card
- Other (with custom notes)

## Statement Status
- **Draft**: Newly created, not yet sent
- **Sent**: Delivered to customer via WhatsApp, email, or manually

## Usage Flow

1. **Customer Management**: Add/view customers in `/customer-statements/customers`
2. **Payment Recording**: Add payments received in the payments section
3. **Statement Generation**: 
   - Select customer and date range
   - Preview statement data
   - Generate formal statement
4. **Statement Sending**:
   - Choose delivery method (WhatsApp/Email/Manual)
   - Customize message for WhatsApp
   - Mark as sent to track delivery

## WhatsApp Message Template

The system generates formatted messages like:

```
Hi [Customer Name],

Here's your account statement for the period [Date Range]:

📊 *Account Summary*
• Total Sales: $X,XXX.XX
• Payments Received: $X,XXX.XX  
• Outstanding Balance: $X,XXX.XX

[Payment status message]

If you have any questions, please don't hesitate to contact us.

Best regards,
[Company Name]
```

## Technical Details

### Key Hooks
- `useCustomers()` - Customer management
- `useCustomerStatements()` - Statement operations
- `useCustomerPayments()` - Payment tracking
- `useWhatsAppIntegration()` - WhatsApp sending

### Database Functions
- `calculate_customer_statement()` - Calculates totals for date range
- `sync_customer_from_invoice()` - Auto-creates customers from invoices
- Row Level Security (RLS) policies for all new tables

## Security
- All new tables have RLS enabled
- Users can only access their own data
- API endpoints validate user authentication
- Phone numbers are formatted for WhatsApp compatibility

## Future Enhancements
- Email integration with SMTP
- PDF statement generation
- Automated reminders for overdue amounts
- Payment plan tracking
- Customer payment history reports
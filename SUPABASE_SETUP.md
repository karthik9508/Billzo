# Supabase Database Integration Setup

Your Next.js Invoice Generator project already has comprehensive Supabase integration! Here's how to complete the setup:

## ✅ Already Configured

Your project includes:
- Supabase client configuration (`src/lib/supabase/client.ts` & `src/lib/supabase/server.ts`)
- Database schema with migrations (`supabase/migrations/001_initial_schema.sql`)
- TypeScript database types (`src/types/database.ts`)
- Authentication service (`src/lib/supabase/services/auth.ts`)
- Invoice service with CRUD operations (`src/lib/supabase/services/invoice.ts`)
- Profile and settings services
- Row Level Security (RLS) policies
- Authentication context and middleware
- Protected routes middleware

## 🔧 Required Setup Steps

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to be ready

### 2. Set Up Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Get your project credentials from your Supabase dashboard:
   - Go to Settings → API
   - Copy your Project URL and anon public key

3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### 3. Run Database Migrations
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase locally (optional):
   ```bash
   supabase init
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Push migrations to your database:
   ```bash
   supabase db push
   ```

### 4. Start Development
```bash
npm run dev
```

## 📊 Database Schema

Your database includes these tables:
- `user_profiles` - User profile information and company details
- `user_settings` - User preferences and default settings
- `invoices` - Invoice records with client and payment info
- `invoice_items` - Line items for each invoice

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Automatic user profile creation on signup
- Protected routes with middleware
- Session management with cookies

## 🚀 Available Services

### Authentication (`authService`)
- Sign up / Sign in
- Password reset
- Session management
- User state tracking

### Invoice Management (`invoiceService`)
- Create, read, update, delete invoices
- Real-time subscriptions
- Dashboard statistics
- Client management

### Profile & Settings
- User profile management
- Company information
- User preferences

## 🎯 Next Steps

1. Set up your environment variables
2. Push the database schema to Supabase
3. Start building your invoice features!

The integration is ready to use - just add your Supabase credentials and you're good to go!
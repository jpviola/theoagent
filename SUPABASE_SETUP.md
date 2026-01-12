# 🗄️ Supabase Database Setup Guide

## Step 1: Create Supabase Project

1. **Visit Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in to your account
   - Click "New Project"

2. **Project Configuration**
   - **Organization**: Select or create one
   - **Name**: `theoagent-prod` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier

3. **Wait for Setup**
   - Project creation takes 2-3 minutes
   - You'll see a loading screen with setup progress

## Step 2: Configure Environment Variables

1. **Get Your Supabase Credentials**
   - In your Supabase project dashboard
   - Go to **Settings > API**
   - Copy these values:
     - `Project URL` (starts with https://...)
     - `anon/public` key (starts with eyJ...)
     - `service_role` key (also starts with eyJ...)

2. **Update Your .env.local File**
   ```bash
   # Copy from .env.example
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your actual values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Keep your existing Anthropic key
   ANTHROPIC_API_KEY=your_existing_key
   ```

## Step 3: Set Up Database Schema

1. **Open SQL Editor**
   - In your Supabase project dashboard
   - Go to **SQL Editor**
   - Click "New query"

2. **Run the Schema Script**
   - Copy the entire content from `src/sql/schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" button
   - You should see "Success. No rows returned."

3. **Verify Tables Created**
   - Go to **Table Editor**
   - You should see these tables:
     - `profiles`
     - `theological_sources`
     - `daily_gospel_readings`
     - `conversations`

## Step 4: Configure Authentication

1. **Authentication Settings**
   - Go to **Authentication > Settings**
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`

2. **Enable Auth Providers**
   - **Email**: Already enabled by default
   - **Google OAuth** (recommended):
     - Go to **Authentication > Providers**
     - Enable Google
     - Follow Google OAuth setup guide
     - Add your OAuth credentials

3. **Email Templates (Optional)**
   - Go to **Authentication > Email Templates**
   - Customize confirmation and reset password emails
   - Add your branding and styling

## Step 5: Test Database Connection

1. **Start Your Development Server**
   ```bash
   npm run dev
   ```

2. **Test Authentication**
   - Visit `http://localhost:3000`
   - Try creating a new account
   - Check if user appears in **Authentication > Users**
   - Verify profile is created in **Table Editor > profiles**

## Step 6: Load Sample Data

The schema automatically includes:
- ✅ Sample theological sources (English & Spanish)
- ✅ Daily gospel reading for today
- ✅ All necessary database functions and triggers

## Step 7: Security Configuration

1. **Row Level Security (RLS)**
   - Already enabled by our schema
   - Users can only see their own data
   - Theological sources are read-only for all users

2. **API Keys Security**
   - ✅ `anon` key is safe for client-side use
   - ⚠️ `service_role` key should NEVER be exposed to clients
   - Keep `service_role` key only in server-side environment variables

## Step 8: Production Setup

When deploying to Vercel:

1. **Update Environment Variables**
   - In Vercel dashboard: Settings > Environment Variables
   - Add all your Supabase variables
   - Update Site URL to your domain: `https://your-app.vercel.app`

2. **Update Redirect URLs**
   - In Supabase: Authentication > Settings
   - Add production URL: `https://your-app.vercel.app/auth/callback`

## Troubleshooting

### Common Issues:

1. **"Invalid API key" Error**
   - Double-check your environment variables
   - Ensure no extra spaces or characters
   - Restart your development server

2. **Schema Creation Errors**
   - Make sure you copied the entire SQL script
   - Run script sections separately if needed
   - Check for syntax errors in SQL Editor

3. **Authentication Not Working**
   - Verify redirect URLs match exactly
   - Check browser developer console for errors
   - Ensure Site URL is correct

4. **Database Connection Issues**
   - Confirm project is fully initialized (not still setting up)
   - Test connection in SQL Editor first
   - Check network connectivity

### Need Help?

- 📧 Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
- 🎯 Next.js + Supabase Guide: [supabase.com/docs/guides/getting-started/tutorials/with-nextjs](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- 🔒 RLS Guide: [supabase.com/docs/guides/auth/row-level-security](https://supabase.com/docs/guides/auth/row-level-security)

---

## Next Steps After Setup

Once your database is running:

1. **✅ Test user registration and login**
2. **✅ Verify subscription tier system**
3. **✅ Test usage limits and tracking**
4. **🔄 Set up Stripe integration (optional)**
5. **🔄 Create landing page**
6. **🔄 Deploy to production**
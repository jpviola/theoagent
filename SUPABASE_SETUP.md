# 🗄️ Supabase Database Setup Guide

## Step 1: Create Supabase Project

1. **Visit Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in to your account
   - Click "New Project"

2. **Project Configuration**
   - **Organization**: Select or create one
   - **Name**: `santaPalabra-prod` (or your preferred name)
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
     - `saints` (New)
     - `books` (New)
     - `regional_data` (New)

## Step 4: Data Migration (JSON -> Supabase)

To move your local JSON data (Saints, Books, Regional Data) to Supabase:

1. Ensure `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`.
2. Run the migration script:
   ```bash
   npx tsx scripts/migrate-to-supabase.ts
   ```

## Step 5: Media Storage (MP3/Video)

For future audio/video files, use **Supabase Storage**:

1. Go to **Storage** in Dashboard.
2. Create a new public bucket named `media`.
3. Upload your MP3s/Videos there.
4. The URL format will be: `https://[project-id].supabase.co/storage/v1/object/public/media/[filename]`

## Step 6: Configure Authentication

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

## Step 7: Test Database Connection

1. **Start Your Development Server**
   ```bash
   npm run dev
   ```

2. **Test Authentication**
   - Visit `http://localhost:3000`
   - Try creating a new account
   - Check if user appears in **Authentication > Users**
   - Verify profile is created in **Table Editor > profiles**

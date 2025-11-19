# Supabase Setup Instructions

This guide will help you set up Supabase for shared version storage in the Product Penetration Calculator.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in with your GitHub account
3. Click "New Project"
4. Fill in:
   - **Name**: `product-penetration-calculator` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (takes 1-2 minutes)

## Step 2: Create the Database Table

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy and paste the contents of `supabase-setup.sql` into the editor
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 3: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API** (left sidebar)
2. Make sure you're on the **"API Keys"** tab (not "Legacy API Keys")
3. You'll see:
   - **Project URL**: Copy this value (found at the top of the page)
   - **Publishable key**: Copy this value (starts with `sb_publishable_...`)
     - This is the new format - use this instead of the legacy anon key
     - It's safe to use in browsers with RLS enabled

## Step 4: Configure Environment Variables

### For Local Development:

1. Create a `.env` file in the project root (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_publishable_key_here
   ```
   **Note**: Use the **Publishable key** (starts with `sb_publishable_...`), not the legacy anon key.

3. Restart your dev server:
   ```bash
   npm run dev
   ```

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - **Name**: `VITE_SUPABASE_URL`
     **Value**: Your Supabase project URL
   - **Name**: `VITE_SUPABASE_ANON_KEY`
     **Value**: Your Supabase **Publishable key** (starts with `sb_publishable_...`)
     - **Important**: Use the Publishable key from the "API Keys" tab, not the legacy anon key
4. Click "Save"
5. Redeploy your application (Vercel will automatically redeploy when you push changes, or you can manually trigger a redeploy)

## Step 5: Test the Setup

1. Open your application
2. Create a new version by clicking "Save"
3. The version should appear in the saved versions list
4. Refresh the page - the version should still be there (shared storage working!)
5. Open the app in a different browser/incognito window - you should see the same versions (shared across users!)

## Troubleshooting

### Versions not appearing?
- Check the browser console for errors
- Verify your environment variables are set correctly
- Check Supabase dashboard → **Table Editor** → `versions` table to see if data is being saved

### "Supabase not configured" warning?
- Make sure your `.env` file exists and has the correct variable names
- Restart your dev server after creating/updating `.env`
- For Vercel, ensure environment variables are set in the dashboard

### Database connection errors?
- Verify your Supabase project is active (not paused)
- Check that the `versions` table exists in Supabase
- Verify RLS policies allow public access (or adjust based on your security needs)

## Security Note

The current setup allows public read/write access to versions. For production use with sensitive data, consider:
- Adding user authentication
- Implementing row-level security policies based on user IDs
- Adding rate limiting
- Using service role key for server-side operations (never expose this in client code!)


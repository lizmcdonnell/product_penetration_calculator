# Troubleshooting: Versions Not Sharing Across Browsers

If versions are not appearing across different browsers, follow these steps:

## Step 1: Check Browser Console

1. Open your deployed app in a browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the **Console** tab
4. Look for these messages:
   - ✅ `Supabase connected: [your-url]` - Connection is working
   - ❌ `Supabase not connected - versions will be stored locally only` - Environment variables missing
   - Any red error messages about Supabase

## Step 2: Verify Vercel Environment Variables

The app needs these environment variables set in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify these variables exist:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### How to Add/Update Environment Variables:

1. In Vercel, go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Add each variable:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - **Environment**: Select all (Production, Preview, Development)
4. Repeat for `VITE_SUPABASE_ANON_KEY`
5. **Important**: After adding/updating variables, you must **redeploy** your project:
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Select **Redeploy**

## Step 3: Verify Supabase Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL from `supabase-setup.sql` to ensure the `versions` table exists
4. Check **Table Editor** → `versions` table exists
5. Verify **Authentication** → **Policies**:
   - The `versions` table should have a policy allowing public access

## Step 4: Test the Connection

After redeploying with environment variables:

1. Open the app in a browser
2. Check the console for connection status
3. Try saving a version
4. Open the app in a different browser/device
5. Check if the version appears

## Step 5: Check Supabase Logs

1. Go to Supabase dashboard
2. Navigate to **Logs** → **Postgres Logs**
3. Look for any errors when saving/loading versions

## Common Issues:

### Issue: "Supabase not connected" in console
**Solution**: Environment variables are not set in Vercel. Follow Step 2.

### Issue: "Error fetching versions" in console
**Solution**: 
- Check Supabase RLS policies allow public access
- Verify the `versions` table exists
- Check Supabase logs for specific errors

### Issue: Versions save locally but don't appear in other browsers
**Solution**: The app is falling back to localStorage. Check:
- Environment variables are set correctly
- **You're using the NEW "Publishable key" (starts with `sb_publishable_...`), NOT the legacy anon key**
- You've redeployed after setting variables
- Supabase connection is working (check console)

### Issue: Using Legacy API Keys
**Solution**: Supabase has updated their API keys. If you're using the legacy "Anon Public Key" (starts with `eyJ...`), it may not work properly. 
- Go to **Settings** → **API** → **"API Keys"** tab (not "Legacy API Keys")
- Copy the **"Publishable key"** (starts with `sb_publishable_...`)
- Update your `VITE_SUPABASE_ANON_KEY` environment variable in Vercel
- Redeploy your application

### Issue: CORS errors
**Solution**: Supabase should handle CORS automatically. If you see CORS errors:
- Verify your Supabase URL is correct
- Check Supabase project settings

## Getting Your Supabase Credentials:

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **API**
3. Make sure you're on the **"API Keys"** tab (not "Legacy API Keys")
4. Find:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **Publishable key** (starts with `sb_publishable_...`) → Use for `VITE_SUPABASE_ANON_KEY`
   - **Important**: Do NOT use the legacy "Anon Public Key" from the "Legacy API Keys" tab. Use the new "Publishable key" instead.

## Still Not Working?

1. Check the browser console for specific error messages
2. Verify environment variables are set for all environments (Production, Preview, Development)
3. Ensure you've redeployed after setting environment variables
4. Check Supabase logs for database errors
5. Verify the `versions` table structure matches the expected schema


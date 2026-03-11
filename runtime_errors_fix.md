# Runtime Errors Fix Guide

## Issues Identified & Solutions

### 1. PWA Banner Warning
**Error**: `Banner not shown: beforeinstallpromptevent.preventDefault() called. The page must call beforeinstallpromptevent.prompt() to show the banner.`

**Status**: ✅ **This is actually working correctly!**
- The app prevents the default browser banner and shows a custom Add to Home Screen component
- Fixed DOM removal error by adding `mode="wait"` and `key` prop to AnimatePresence
- Custom banner provides better UX with platform-specific instructions

### 2. WhatsApp Leads 403 Error
**Error**: `Failed to load resource: the server responded with a status of 403 (whatsapp_leads)`

**Solution**: Apply RLS policy to Supabase
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the SQL from `apply_rls_policy.sql`
4. This will create the necessary policies for anonymous/authenticated users to insert/update WhatsApp leads

**SQL Commands**:
```sql
-- Already created in apply_rls_policy.sql
-- Just copy-paste into Supabase SQL Editor
```

### 3. DOM Removal Error
**Error**: `NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.`

**Status**: ✅ **Fixed**
- Added `mode="wait"` to AnimatePresence
- Added unique `key="pwa-banner"` to motion.div
- This prevents Framer Motion from trying to remove already-removed DOM nodes

## Steps to Fix

### Step 1: Apply RLS Policy (Required)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to SQL Editor
4. Copy the contents of `apply_rls_policy.sql`
5. Paste and run the SQL
6. Verify success (no errors)

### Step 2: Deploy Updated Code
The DOM removal fix is already implemented in the latest code. Just deploy:
```bash
npm run build
git add -A
git commit -m "fix: runtime errors - DOM removal and RLS policy prep"
git push origin master
```

### Step 3: Verify Fixes
1. **PWA Banner**: Should show custom banner without console warnings
2. **WhatsApp Leads**: Form submissions should work without 403 errors
3. **DOM Errors**: No more removeChild errors in console

## Technical Details

### PWA Implementation
- Uses `beforeinstallprompt` to capture install event
- Prevents default browser banner
- Shows custom AddToHomeScreen component
- Handles both iOS and Android platforms

### RLS Policy
- Allows `anon` and `authenticated` users to insert WhatsApp leads
- Allows `anon` and `authenticated` users to update existing leads (for upsert)
- Enables Row Level Security on `whatsapp_leads` table

### Framer Motion Fix
- `mode="wait"` ensures proper exit animation cleanup
- `key` prop helps React track component identity
- Prevents DOM node removal conflicts

## Testing

After applying fixes:
1. Test WhatsApp lead form on landing page
2. Test PWA install banner on mobile/desktop
3. Check browser console for errors
4. Verify smooth animations without DOM errors

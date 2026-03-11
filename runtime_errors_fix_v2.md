# Runtime Errors Fix Guide - Version 2

## Issues Identified & Solutions

### 1. Manifest.json 401 Error
**Error**: `Failed to load resource: the server responded with a status of 401 (manifest.json)`

**Cause**: Authentication middleware blocking static files

**Solutions**:
1. **Server Configuration**: Ensure static files are served without authentication
2. **Vercel Configuration**: Add vercel.json to exclude static files from auth
3. **Manifest Location**: Verify manifest.json is in public folder

**Fix**: Create `vercel.json` to exclude static files from authentication:

```json
{
  "rewrites": [
    {
      "source": "/manifest.json",
      "destination": "/manifest.json"
    },
    {
      "source": "/icon-192.png",
      "destination": "/icon-192.png"
    },
    {
      "source": "/icon-512.png",
      "destination": "/icon-512.png"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        }
      ]
    }
  ]
}
```

### 2. WhatsApp Leads 401 Error
**Error**: `Failed to load resource: the server responded with a status of 401 (whatsapp_leads)`

**Status**: ⚠️ **Requires Manual Action**

**Solution**: Apply RLS policy to Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to SQL Editor
4. Run the SQL from `apply_rls_policy.sql`
5. Verify success (no errors)

**SQL Commands**:
```sql
-- Already created in apply_rls_policy.sql
-- Just copy-paste into Supabase SQL Editor
```

### 3. DOM Insertion Error
**Error**: `NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.`

**Status**: ✅ **Fixed**
- Changed `mode="wait"` to `mode="sync"` in AnimatePresence
- Added unique `key="pwa-banner"` to motion.div
- This prevents Framer Motion DOM manipulation conflicts

### 4. Zustand Deprecated Warning
**Error**: `[DEPRECATED] Default export is deprecated. Instead use import { create } from 'zustand'`

**Status**: ⚠️ **Warning Only**
- This is a deprecation warning, not an error
- Will be fixed when zustand is updated
- Does not affect functionality

## Steps to Fix

### Step 1: Create Vercel Configuration (Required)
Create `vercel.json` in project root:

```json
{
  "rewrites": [
    {
      "source": "/manifest.json",
      "destination": "/manifest.json"
    },
    {
      "source": "/icon-192.png",
      "destination": "/icon-192.png"
    },
    {
      "source": "/icon-512.png",
      "destination": "/icon-512.png"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        }
      ]
    }
  ]
}
```

### Step 2: Apply RLS Policy (Required)
1. Go to Supabase Dashboard
2. SQL Editor
3. Run contents of `apply_rls_policy.sql`
4. Check for success message

### Step 3: Deploy Updates
```bash
npm run build
git add -A
git commit -m "fix: runtime errors - manifest 401, DOM insertion, RLS policy prep"
git push origin master
```

### Step 4: Deploy to Vercel
1. Push to GitHub triggers Vercel deployment
2. Verify static files are accessible
3. Test PWA functionality

## Technical Details

### Manifest.json Issues
- Static files should bypass authentication
- Vercel needs explicit routing for PWA files
- Cache headers improve performance

### RLS Policy Details
- Allows anonymous users to insert WhatsApp leads
- Allows authenticated users to update existing leads
- Enables Row Level Security on whatsapp_leads table

### DOM Manipulation Fix
- `mode="sync"` ensures proper DOM cleanup
- `key` prop prevents React reconciliation issues
- Framer Motion handles animations more reliably

## Testing After Fixes

1. **Manifest**: Check `https://your-domain.com/manifest.json` loads without 401
2. **WhatsApp Form**: Test lead capture on landing page
3. **PWA Install**: Verify add to home screen works
4. **Console**: No DOM manipulation errors
5. **Mobile**: Test PWA installation on mobile devices

## Expected Results

- ✅ Manifest loads without 401 errors
- ✅ WhatsApp lead form works without 401 errors  
- ✅ No DOM insertion/removal errors
- ✅ PWA installation works correctly
- ✅ Console clean (except zustand warning)

# Upload Zulu Method Logo to Supabase Storage

## Overview

The official Zulu Method logo should be stored in Supabase Storage so it can be dynamically loaded by the application. This ensures consistent branding across all deployments.

## Storage Location

- **Bucket**: `CAB Avatars` (already exists)
- **Path**: `brand/zulu-method-logo.png`
- **Full path**: `CAB Avatars/brand/zulu-method-logo.png`

## Upload Instructions

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rhbxbrzvefllzqfuzdwb
2. Navigate to **Storage** → **Buckets** → **CAB Avatars**
3. Click **Upload file** or **New folder**
4. Create a folder named `brand` (if it doesn't exist)
5. Navigate into the `brand` folder
6. Upload your logo file and name it exactly: `zulu-method-logo.png`
   - If your logo is SVG, you can name it `zulu-method-logo.svg` and update the path in `services/logoService.ts`
   - Supported formats: PNG, SVG, JPG

### Option 2: Via Supabase Storage API (Programmatic)

If you prefer to upload programmatically, you can use this code snippet:

```typescript
import { supabase } from './services/supabaseClient';

async function uploadLogo(file: File) {
  const { data, error } = await supabase.storage
    .from('CAB Avatars')
    .upload('brand/zulu-method-logo.png', file, {
      cacheControl: '3600',
      upsert: true // Overwrites if exists
    });

  if (error) {
    console.error('Error uploading logo:', error);
    return;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('CAB Avatars')
    .getPublicUrl('brand/zulu-method-logo.png');
  
  console.log('Logo uploaded! Public URL:', urlData.publicUrl);
}
```

## Verify Upload

After uploading, verify the logo is accessible:

1. Go to **Storage** → **Buckets** → **CAB Avatars** → **brand**
2. You should see `zulu-method-logo.png` listed
3. Click on it and verify the preview shows correctly
4. Click **Get URL** to verify the public URL works

## File Requirements

- **Format**: PNG (recommended) or SVG
- **Size**: Optimized for web (ideally < 100KB)
- **Dimensions**: Should work well at 40px height (h-10 in Tailwind)
- **Transparency**: PNG with transparency is recommended

## How It Works

1. The `ZuluLogo` component calls `getLogoUrl()` from `logoService.ts`
2. The service gets the public URL from Supabase Storage
3. If Supabase is not configured or logo doesn't exist, it falls back to public folder
4. The logo is displayed in the top-left header of the app

## Troubleshooting

### Logo Not Showing

1. Check that the bucket `CAB Avatars` is **public** (required for public URLs)
2. Verify the file path is exactly `brand/zulu-method-logo.png`
3. Check browser console for any loading errors
4. Verify the file uploaded successfully in Supabase Dashboard

### Logo Shows Fallback

If you see the "ZM" placeholder instead of your logo:
1. Check that the file exists at the correct path
2. Verify the bucket is public
3. Check browser console for errors
4. Try accessing the public URL directly in a new tab

## Notes

- The logo is stored in the same bucket as user avatars (`CAB Avatars`)
- The `brand/` folder keeps brand assets separate from user uploads
- The logo is not user-editable - it's a fixed brand asset
- The component falls back gracefully if Supabase is unavailable


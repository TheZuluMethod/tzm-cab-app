# Admin Recovery Setup Guide

## Overview

This guide covers both admin recovery options:
- **Option 2**: Multiple Admin Emails (Simple, Immediate) ✅ Ready to use
- **Option 1**: Environment Variable + Database Flag (Enhanced Security) ⚠️ Requires setup

---

## ✅ Option 2: Multiple Admin Emails (COMPLETE)

### Status: ✅ Ready to Use

**What's Done**:
- ✅ Backup admin email system implemented in `services/analyticsService.ts`
- ✅ Easy to add backup emails by uncommenting lines in `isAppMaker()` function

### How to Add Backup Admin Emails:

1. Open `services/analyticsService.ts`
2. Find the `isAppMaker()` function (around line 147)
3. Uncomment and add backup emails:

```typescript
const adminEmails = [
  'hbrett@thezulumethod.com', // Primary admin email
  'backup-admin@thezulumethod.com', // Uncomment and add backup email
  'emergency-admin@thezulumethod.com', // Uncomment and add emergency email
];
```

4. Save the file - backup emails are now active!

### Testing:
- Log in with backup admin email
- Verify admin privileges work (no upgrade nag, full access)

---

## ⚠️ Option 1: Environment Variable + Database Flag (REQUIRES SETUP)

### Status: ⚠️ Code Ready, Requires Deployment

**What's Done**:
- ✅ Database migration created: `supabase/migrations/add_super_admin_column.sql`
- ✅ Edge Function created: `supabase/functions/admin-recovery/index.ts`
- ✅ Recovery scripts created: `scripts/admin-recovery-example.sh` and `.ps1`
- ✅ `isAppMakerAsync()` function created for database flag check

**What Needs Setup**:
1. Run database migration
2. Deploy Edge Function
3. Set environment variables
4. Test recovery process

---

## Step-by-Step Setup for Option 1

### Step 1: Run Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/add_super_admin_column.sql`
3. Copy and paste into SQL Editor
4. Click **Run**
5. Verify success message appears

**What This Does**:
- Adds `is_super_admin` column to `users` table
- Creates index for faster lookups
- Creates helper function `is_user_super_admin()`

### Step 2: Deploy Edge Function

1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy the Edge Function:
   ```bash
   supabase functions deploy admin-recovery
   ```

**Alternative**: Use Supabase Dashboard
1. Go to Supabase Dashboard → Edge Functions
2. Click **Create Function**
3. Name: `admin-recovery`
4. Copy contents from `supabase/functions/admin-recovery/index.ts`
5. Click **Deploy**

### Step 3: Set Environment Variables

1. Go to Supabase Dashboard → Edge Functions → `admin-recovery`
2. Click **Settings** → **Environment Variables**
3. Add these variables:

   **Required**:
   - `ADMIN_RECOVERY_KEY`: Generate a secure random key (min 32 characters)
     - Example: `openssl rand -hex 32` or use a password generator
     - **IMPORTANT**: Store this securely (password manager)
   
   **Already Set** (should exist):
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### Step 4: Generate Recovery Key

**Option A: Using OpenSSL** (Linux/Mac):
```bash
openssl rand -hex 32
```

**Option B: Using PowerShell** (Windows):
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Option C: Online Generator**:
- Use a secure password generator (64+ characters)
- Store in password manager immediately

### Step 5: Test Recovery Process

**Using PowerShell Script** (Windows):
```powershell
.\scripts\admin-recovery-example.ps1 -UserEmail "user@example.com" -AdminRecoveryKey "your-key-here"
```

**Using Bash Script** (Linux/Mac):
```bash
chmod +x scripts/admin-recovery-example.sh
./scripts/admin-recovery-example.sh user@example.com
```

**Manual Test** (cURL):
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/admin-recovery" \
  -H "Authorization: Bearer YOUR_ADMIN_RECOVERY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_email": "user@example.com"}'
```

### Step 6: Update Code to Use Enhanced Check (Optional)

Where you have access to `userId`, use `isAppMakerAsync()` for full security:

```typescript
import { isAppMakerAsync } from './services/analyticsService';

// Instead of:
const isAdmin = isAppMaker(user.email);

// Use:
const isAdmin = await isAppMakerAsync(user.email, user.id);
```

**Note**: Most places can keep using `isAppMaker()` for backward compatibility. The async version adds the database flag check.

---

## Recovery Procedure (If Admin Account Lost)

### Using Option 2 (Backup Emails):
1. Log in with backup admin email
2. Access Account Panel
3. Verify admin privileges work
4. Reset primary admin account if needed

### Using Option 1 (Recovery Function):
1. Get `ADMIN_RECOVERY_KEY` from secure storage
2. Run recovery script or make API call:
   ```bash
   ./scripts/admin-recovery-example.sh user@example.com
   ```
3. Function sets `is_super_admin = true` for specified user
4. User logs in and has admin access
5. User can then reset primary admin account

---

## Security Best Practices

1. ✅ **Never commit recovery keys to Git**
2. ✅ **Store ADMIN_RECOVERY_KEY in password manager**
3. ✅ **Rotate recovery key periodically** (every 6-12 months)
4. ✅ **Log all recovery attempts** (check Edge Function logs)
5. ✅ **Limit who has access to recovery key**
6. ✅ **Use strong recovery key** (64+ random characters)
7. ✅ **Test recovery process** before you need it

---

## Current Status

### Option 2 (Multiple Admin Emails):
- ✅ Code implemented
- ✅ Ready to use
- ⚠️ No backup emails added yet (add them in `analyticsService.ts`)

### Option 1 (Database Flag):
- ✅ Migration created
- ✅ Edge Function created
- ✅ Recovery scripts created
- ⚠️ Migration not run yet
- ⚠️ Edge Function not deployed yet
- ⚠️ Environment variables not set yet

---

## Next Steps

1. **Immediate**: Add backup admin email to `isAppMaker()` function
2. **Short-term**: Run migration and deploy Edge Function for Option 1
3. **Long-term**: Test recovery process and document securely

---

## Troubleshooting

### Migration Fails:
- Check you're connected to correct Supabase project
- Verify `users` table exists
- Check for column name conflicts

### Edge Function Fails:
- Verify environment variables are set
- Check function logs in Supabase Dashboard
- Ensure service role key is correct

### Recovery Doesn't Work:
- Verify `ADMIN_RECOVERY_KEY` matches environment variable
- Check user email exists in `users` table
- Verify `is_super_admin` column exists
- Check Edge Function logs for errors

---

## Files Created

- ✅ `supabase/migrations/add_super_admin_column.sql` - Database migration
- ✅ `supabase/functions/admin-recovery/index.ts` - Recovery Edge Function
- ✅ `scripts/admin-recovery-example.sh` - Bash recovery script
- ✅ `scripts/admin-recovery-example.ps1` - PowerShell recovery script
- ✅ `ADMIN_RECOVERY_SETUP.md` - This guide

---

## Support

If you encounter issues:
1. Check Supabase Dashboard → Edge Functions → Logs
2. Check Supabase Dashboard → SQL Editor → Query History
3. Verify all environment variables are set correctly
4. Test with a non-admin account first


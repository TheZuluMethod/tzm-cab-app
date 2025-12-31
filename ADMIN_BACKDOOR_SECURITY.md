# Admin Backdoor Security Plan

## Overview
This document outlines the secure backdoor mechanism for admin account recovery in case the primary admin account (`hbrett@thezulumethod.com`) is lost or corrupted.

## Current Admin Setup
- **Primary Admin Email**: `hbrett@thezulumethod.com`
- **Detection Method**: `isAppMaker()` function in `services/analyticsService.ts`
- **Current Implementation**: Hardcoded email check

## Recommended Backdoor Solutions (Ranked by Security)

### Option 1: Environment Variable + Database Flag (RECOMMENDED - Highest Security)
**Security Level**: ⭐⭐⭐⭐⭐

**Implementation**:
1. **Environment Variable**: Store admin recovery key in `.env` file (never commit to Git)
   ```env
   ADMIN_RECOVERY_KEY=your-super-secret-random-key-here-min-32-chars
   ```

2. **Database Flag**: Add `is_super_admin` boolean column to `public.users` table
   - Only settable via Supabase SQL editor with service role key
   - Cannot be set via normal user operations

3. **Recovery Function**: Create Supabase Edge Function that:
   - Requires `ADMIN_RECOVERY_KEY` in request headers
   - Validates key against environment variable
   - Sets `is_super_admin = true` for specified user
   - Logs all recovery attempts

**Pros**:
- ✅ Highest security (requires both env var AND database access)
- ✅ Audit trail of all recovery attempts
- ✅ Can be disabled by removing env var
- ✅ No code changes needed for normal operations

**Cons**:
- ⚠️ Requires Supabase Edge Function setup
- ⚠️ Need to securely store recovery key

---

### Option 2: Multiple Admin Emails (Good Security)
**Security Level**: ⭐⭐⭐⭐

**Implementation**:
1. Add backup admin emails to `isAppMaker()` function:
   ```typescript
   const adminEmails = [
     'hbrett@thezulumethod.com',
     'backup-admin@thezulumethod.com', // Backup email
     'emergency-admin@thezulumethod.com', // Emergency email
   ];
   ```

2. Store backup emails in Supabase `public.admin_users` table
3. Add UI in Account Panel for admins to add backup emails

**Pros**:
- ✅ Simple to implement
- ✅ Multiple recovery paths
- ✅ Easy to add/remove admins

**Cons**:
- ⚠️ Requires managing multiple email accounts
- ⚠️ Less secure if email accounts are compromised

---

### Option 3: Supabase Service Role Key + Database Function (Very Secure)
**Security Level**: ⭐⭐⭐⭐⭐

**Implementation**:
1. Create Supabase database function that can only be called with service role key:
   ```sql
   CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
   RETURNS BOOLEAN
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     -- Only works with service role key
     UPDATE public.users 
     SET is_admin = true 
     WHERE email = user_email;
     RETURN TRUE;
   END;
   $$;
   ```

2. Create script that uses service role key to call function
3. Store service role key securely (password manager, not in code)

**Pros**:
- ✅ Very secure (requires Supabase service role key)
- ✅ No code changes needed
- ✅ Can be run from anywhere with key

**Cons**:
- ⚠️ Service role key is powerful (must be kept extremely secure)
- ⚠️ Requires manual script execution

---

### Option 4: Time-Limited Recovery Token (Good Security)
**Security Level**: ⭐⭐⭐⭐

**Implementation**:
1. Generate recovery token stored in Supabase `public.admin_recovery_tokens` table
2. Token expires after 24 hours
3. Token can only be used once
4. Token generation requires existing admin OR service role key

**Pros**:
- ✅ Time-limited (reduces risk if leaked)
- ✅ Single-use (prevents replay attacks)
- ✅ Can be generated proactively

**Cons**:
- ⚠️ Requires token management system
- ⚠️ More complex implementation

---

## Recommended Implementation Plan

### Phase 1: Immediate (Option 2 - Multiple Admin Emails)
1. Add backup admin email to `isAppMaker()` function
2. Document backup email in secure location
3. Test backup admin access

### Phase 2: Enhanced Security (Option 1 - Environment Variable + Database)
1. Add `is_super_admin` column to `users` table
2. Create Supabase Edge Function for recovery
3. Store `ADMIN_RECOVERY_KEY` in environment variables
4. Document recovery process

### Phase 3: Long-term (Option 3 - Service Role Script)
1. Create recovery script using service role key
2. Store script and key securely
3. Document recovery procedure

---

## Recovery Procedure (If Admin Account Lost)

### Using Multiple Admin Emails (Option 2):
1. Log in with backup admin email
2. Access Account Panel
3. Verify admin privileges
4. Reset primary admin account if needed

### Using Environment Variable + Database (Option 1):
1. Access Supabase SQL Editor with service role key
2. Call recovery Edge Function with `ADMIN_RECOVERY_KEY`
3. Function sets `is_super_admin = true` for specified user
4. User logs in and has admin access

### Using Service Role Script (Option 3):
1. Run recovery script with service role key
2. Script calls database function to promote user to admin
3. User logs in and has admin access

---

## Security Best Practices

1. **Never commit admin keys/tokens to Git**
2. **Store recovery keys in password manager**
3. **Rotate recovery keys periodically**
4. **Log all recovery attempts**
5. **Use environment variables for sensitive data**
6. **Limit who has access to service role key**
7. **Document recovery procedure in secure location**

---

## Current Status

- ✅ Primary admin email configured: `hbrett@thezulumethod.com`
- ⚠️ No backup admin emails configured
- ⚠️ No recovery mechanism implemented
- ⚠️ No `is_super_admin` database flag

---

## Next Steps

1. **Immediate**: Add backup admin email to `isAppMaker()` function
2. **Short-term**: Implement Option 1 (Environment Variable + Database)
3. **Long-term**: Create recovery documentation and test procedures


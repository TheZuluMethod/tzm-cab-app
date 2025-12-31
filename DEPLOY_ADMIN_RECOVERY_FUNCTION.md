# Deploy Admin Recovery Edge Function - Quick Guide

## ✅ Step 1: Database Migration - COMPLETE!

You've successfully run the migration. The `is_super_admin` column is now in your database.

---

## 📋 Step 2: Deploy Edge Function

### Option A: Using Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard → **Edge Functions**
2. Click **Create Function**
3. Function name: `admin-recovery`
4. Copy the entire contents of `supabase/functions/admin-recovery/index.ts`
5. Paste into the code editor
6. Click **Deploy**

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (get project ref from Supabase Dashboard URL)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy admin-recovery
```

---

## 🔐 Step 3: Set Environment Variables

1. In Supabase Dashboard → **Edge Functions** → `admin-recovery`
2. Click **Settings** → **Environment Variables**
3. Add these variables:

   **Required**:
   ```
   ADMIN_RECOVERY_KEY = [Generate a secure 64+ character random string]
   ```

   **Already Set** (should exist automatically):
   ```
   SUPABASE_URL = [Your project URL]
   SUPABASE_SERVICE_ROLE_KEY = [Your service role key]
   ```

### Generate Recovery Key:

**PowerShell** (Windows):
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Bash** (Linux/Mac):
```bash
openssl rand -hex 32
```

**Important**: Copy the generated key and store it securely (password manager). You'll need it for recovery.

---

## 🧪 Step 4: Test Recovery Function

### Using PowerShell (Windows):

1. Open `scripts/admin-recovery-example.ps1`
2. Update these variables at the top:
   ```powershell
   $SupabaseUrl = "https://your-project.supabase.co"
   $AdminRecoveryKey = "your-generated-key-here"
   ```
3. Run:
   ```powershell
   .\scripts\admin-recovery-example.ps1 -UserEmail "test@example.com"
   ```

### Using cURL:

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/admin-recovery" \
  -H "Authorization: Bearer YOUR_ADMIN_RECOVERY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_email": "test@example.com"}'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Super admin access granted to test@example.com",
  "user_id": "uuid-here"
}
```

---

## ✅ Step 5: Verify It Works

1. Log in with the test account
2. Check Account Panel - should show admin privileges
3. Verify no upgrade nag screens appear
4. Verify domain restrictions are bypassed

---

## 🔄 Step 6: Update Code to Use Enhanced Check (Optional)

The code already supports both methods. The `isAppMaker()` function checks emails, and `isAppMakerAsync()` also checks the database flag.

Most places will continue using `isAppMaker()` for backward compatibility. The async version is available where you have `userId` available.

---

## 📝 Current Status

- ✅ Database migration: **COMPLETE**
- ⚠️ Edge Function deployment: **PENDING**
- ⚠️ Environment variables: **PENDING**
- ⚠️ Testing: **PENDING**

---

## 🆘 Troubleshooting

### Edge Function Not Found:
- Verify function name is exactly `admin-recovery`
- Check you're in the correct Supabase project

### Environment Variable Error:
- Verify `ADMIN_RECOVERY_KEY` is set
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist
- Restart Edge Function after adding variables

### Recovery Fails:
- Check Edge Function logs in Supabase Dashboard
- Verify user email exists in `users` table
- Verify `is_super_admin` column exists (you've done this ✅)
- Check recovery key matches environment variable

---

## 🎯 Next Actions

1. **Deploy Edge Function** (Step 2 above)
2. **Set Environment Variables** (Step 3 above)
3. **Test Recovery** (Step 4 above)
4. **Store Recovery Key Securely** (password manager)

Once complete, you'll have both recovery methods active:
- **Option 2**: Backup admin emails (ready now)
- **Option 1**: Database flag recovery (after deployment)


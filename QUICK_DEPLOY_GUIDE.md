# Quick Deploy Guide - Rate Limiting

## ⚠️ You're Running TypeScript Code in SQL Editor!

The error you're seeing is because you're trying to run **TypeScript code** (Edge Function) in the **SQL Editor**. These are two different things!

---

## ✅ Correct Steps:

### 1. First: Run SQL Migration (In SQL Editor)

**File to use:** `supabase/migrations/create_rate_limits_table.sql`

1. Open Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy the **entire contents** of `create_rate_limits_table.sql`
4. Paste into SQL Editor
5. Click **"Run"** ✅

This creates the `rate_limits` table.

---

### 2. Second: Deploy Edge Function (NOT in SQL Editor!)

**File to use:** `supabase/functions/rate-limit/index.ts`

**Option A: Supabase CLI (Easiest)**

```bash
# Install Supabase CLI (if needed)
npm install -g supabase

# Login
supabase login

# Link your project (get project ref from Dashboard → Settings → General)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy rate-limit
```

**Option B: Supabase Dashboard**

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **"Create a new function"**
3. Name: `rate-limit`
4. Copy contents of `index.ts` into the editor
5. Click **"Deploy"**

---

## 📋 Summary

| What | Where | File |
|------|-------|------|
| SQL Migration | SQL Editor | `create_rate_limits_table.sql` |
| Edge Function | CLI or Dashboard | `rate-limit/index.ts` |

**Never run TypeScript code in SQL Editor!** ❌

---

## 🧪 Test After Deployment

1. Go to Edge Functions → `rate-limit` → **Invoke** tab
2. Test with: `{"endpoint": "test"}`
3. Should return: `{"allowed": true, "remaining": 9, ...}`

---

**Need help?** Check `DEPLOY_RATE_LIMIT_FUNCTION.md` for detailed instructions.


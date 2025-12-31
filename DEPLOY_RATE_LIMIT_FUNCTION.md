# Deploy Rate Limiting Edge Function

## Important: Two Separate Steps

You need to do **TWO separate things**:

1. **Run the SQL migration** (in SQL Editor) - Creates the database table
2. **Deploy the Edge Function** (via CLI or Dashboard) - Deploys the TypeScript function

---

## Step 1: Run SQL Migration (In SQL Editor)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the contents of `supabase/migrations/create_rate_limits_table.sql`
4. Click **"Run"** (or press Ctrl+Enter)
5. Verify success - you should see "Success. No rows returned"

**This creates the `rate_limits` table in your database.**

---

## Step 2: Deploy Edge Function

You have **two options**:

### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Get your project ref from Supabase Dashboard → Settings → General → Reference ID)

4. **Deploy the function**:
   ```bash
   supabase functions deploy rate-limit
   ```

### Option B: Using Supabase Dashboard

1. Open **Supabase Dashboard** → **Edge Functions**
2. Click **"Create a new function"**
3. Name it: `rate-limit`
4. Copy and paste the **entire contents** of `supabase/functions/rate-limit/index.ts`
5. Click **"Deploy"**

**Note:** The dashboard method may require you to create the function folder structure manually. CLI is easier.

---

## Step 3: Verify Deployment

After deploying, test the function:

1. Go to **Supabase Dashboard** → **Edge Functions** → `rate-limit`
2. Click **"Invoke"** tab
3. Use this test payload:
   ```json
   {
     "endpoint": "test"
   }
   ```
4. Click **"Invoke Function"**
5. You should get a response like:
   ```json
   {
     "allowed": true,
     "remaining": 9,
     "limit": 10,
     "resetAt": 1234567890
   }
   ```

---

## Troubleshooting

### Error: "Table rate_limits does not exist"
- **Solution:** Make sure you ran Step 1 (SQL migration) first

### Error: "Function not found"
- **Solution:** Make sure you deployed the function correctly (Step 2)

### Error: "Permission denied"
- **Solution:** Check that RLS policies are set correctly in the SQL migration

---

## How to Use the Rate Limit Function

Once deployed, you can call it from your frontend:

```typescript
const checkRateLimit = async (endpoint: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(`${supabaseUrl}/functions/v1/rate-limit?endpoint=${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
  });
  
  const result = await response.json();
  
  if (!result.allowed) {
    throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter} seconds`);
  }
  
  return result;
};
```

---

## Next Steps

After deployment:
1. Integrate rate limit checks into your API calls
2. Monitor rate limit violations in the `rate_limits` table
3. Adjust limits in `index.ts` if needed

---

**Remember:** 
- SQL migrations → Run in SQL Editor
- Edge Functions → Deploy via CLI or Dashboard
- They are **different things**!


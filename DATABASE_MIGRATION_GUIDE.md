# Database Migration Guide - Add Profile Fields

## ⚠️ Error Fix Required

You're seeing this error: **"Could not find the 'avatar_url' column of 'users' in the schema cache"**

This means the `users` table is missing the `avatar_url` column (and possibly other profile fields).

## 🔧 Quick Fix

### Step 1: Run the Migration SQL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rhbxbrzvefllzqfuzdwb
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file: `supabase/migrate-add-profile-fields.sql`
5. Copy and paste the entire SQL into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

### Step 2: Verify the Migration

After running the SQL, you should see:
- ✅ A success message: "All profile fields added successfully!"
- ✅ A table showing all columns in the `users` table

The table should include these columns:
- `id`
- `email`
- `full_name`
- `phone` ✅ (new)
- `company` ✅ (new)
- `bio` ✅ (new)
- `website` ✅ (new)
- `avatar_url` ✅ (new)
- `created_at`
- `updated_at`

## 📋 What Fields Are Stored

The Account Details form saves these fields to the `users` table:

| Field | Column Name | Type | Description |
|-------|-------------|------|-------------|
| Email | `email` | TEXT | User's email (from auth) |
| Full Name | `full_name` | TEXT | User's full name |
| Phone | `phone` | TEXT | Phone number |
| Company | `company` | TEXT | Company/Organization |
| Website | `website` | TEXT | Website URL (normalized with https://) |
| Bio | `bio` | TEXT | Bio/About Me text |
| Avatar | `avatar_url` | TEXT | URL to avatar image in storage |

## 🔍 Verify Your Data

After running the migration, you can verify your data:

1. Go to **Table Editor** → `users` table
2. You should see your user record with all the new columns
3. Try updating your profile again - it should work now!

## 🐛 Troubleshooting

### If migration fails:
- Check that you're connected to the correct Supabase project
- Ensure you have admin/owner permissions
- Check the SQL Editor for any error messages

### If columns still don't appear:
- Refresh the Table Editor page
- Check that the migration SQL ran without errors
- Verify you're looking at the `public.users` table (not `auth.users`)

## ✅ After Migration

Once the migration is complete:
1. Refresh your browser
2. Go to Account Details
3. Update your profile - it should work without errors!

---

**Note**: This migration is safe to run multiple times. It uses `IF NOT EXISTS` so it won't create duplicate columns.


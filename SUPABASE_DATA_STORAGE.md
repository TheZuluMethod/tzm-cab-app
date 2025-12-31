# Supabase Data Storage Overview

## ✅ Data Storage Structure

All user and session data is stored in Supabase with proper security and easy retrieval.

### 📊 Database Tables

#### 1. `public.users` Table
Stores user profile information (extends Supabase auth.users):

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `id` | UUID | User ID (from auth.users) | Auto |
| `email` | TEXT | User email | Auth |
| `full_name` | TEXT | Full name | Account Details |
| `phone` | TEXT | Phone number | Account Details |
| `company` | TEXT | Company/Organization | Account Details |
| `bio` | TEXT | Bio/About Me | Account Details |
| `website` | TEXT | Website URL | Account Details |
| `avatar_url` | TEXT | Avatar image URL | Account Details |
| `created_at` | TIMESTAMPTZ | Account creation date | Auto |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | Auto |

**Security**: Row Level Security (RLS) ensures users can only access their own data.

#### 2. `public.sessions` Table
Stores board reports and analysis:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Session ID |
| `user_id` | UUID | Owner user ID |
| `title` | TEXT | Report title |
| `input` | JSONB | UserInput data |
| `members` | JSONB | BoardMember[] array |
| `report` | TEXT | Full report text |
| `icp_profile` | JSONB | ICPProfile (optional) |
| `persona_breakdowns` | JSONB | PersonaBreakdown[] (optional) |
| `dashboard_data` | JSONB | DashboardData (optional) |
| `qc_status` | JSONB | Quality control status (optional) |
| `created_at` | TIMESTAMPTZ | Creation date |
| `updated_at` | TIMESTAMPTZ | Last update |

**Security**: RLS ensures users can only access their own sessions.

## 🔄 Data Flow

### User Profile Data
1. **Load**: `AccountPanel` → `getCurrentUser()` → `supabase.from('users').select()` → Form fields
2. **Save**: Form submit → `supabase.from('users').upsert()` → Database
3. **Avatar**: Upload → Storage bucket → Get URL → Save to `avatar_url`

### Session Data
1. **Load**: `App.tsx` → `getSessions()` → `supabase.from('sessions').select()` → Display
2. **Save**: Board complete → `saveSession()` → `supabase.from('sessions').upsert()` → Database
3. **Delete**: User action → `deleteSession()` → `supabase.from('sessions').delete()` → Database

## 🔍 Easy Data Retrieval

### Get User Profile
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

### Get All User Sessions
```typescript
const { data, error } = await supabase
  .from('sessions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Get Single Session
```typescript
const { data, error } = await supabase
  .from('sessions')
  .select('*')
  .eq('id', sessionId)
  .eq('user_id', userId)
  .single();
```

## 🔒 Security Features

✅ **Row Level Security (RLS)**: All tables have RLS policies
✅ **User Isolation**: Users can only access their own data
✅ **Automatic Timestamps**: Created/updated timestamps managed automatically
✅ **Cascade Deletes**: Deleting a user deletes their sessions
✅ **Secure Storage**: Avatars stored in Supabase Storage with user-specific folders

## 📋 Current Status

### ✅ Working
- User authentication
- Session storage and retrieval
- Profile data loading
- Data segmentation (users only see their own data)

### ⚠️ Needs Migration
- `avatar_url` column missing (run migration SQL)
- Other profile fields may be missing if you ran old schema

## 🚀 Next Steps

1. **Run Migration**: Execute `supabase/migrate-add-profile-fields.sql` in Supabase SQL Editor
2. **Verify**: Check Table Editor → `users` table has all columns
3. **Test**: Update your profile - should work without errors!

---

**All data is stored securely and can be easily retrieved using Supabase's query API.**


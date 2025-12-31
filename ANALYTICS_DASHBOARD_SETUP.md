# Analytics Dashboard Setup Guide

The Analytics Dashboard has been added to provide aggregate, anonymous insights across all users. This dashboard is only accessible to the app maker/admin.

## ✅ What's Been Added

1. **Analytics Service** (`services/analyticsService.ts`)
   - Fetches aggregate data across all users
   - Includes metrics like usage trends, feedback types, ICP breakdowns, etc.
   - Only accessible by admin users (identified by email)

2. **Analytics Dashboard Component** (`components/AnalyticsDashboard.tsx`)
   - Beautiful, responsive dashboard with charts and metrics
   - Uses Recharts for visualizations
   - Dark mode compatible
   - Shows:
     - Total users and sessions
     - Monthly usage trends
     - Feedback type breakdowns
     - ICP industry and title breakdowns
     - Board member role analysis
     - Top feedback items
     - Completion rates and more

3. **User Dropdown Integration**
   - Added "Analytics" menu item (only visible to app maker)
   - Located in the user dropdown menu

## 🔧 Setup Instructions

### Step 1: Update Admin Email

Update your admin email in two places:

1. **Frontend** (`services/analyticsService.ts`):
   ```typescript
   const adminEmails = [
     'your-email@example.com', // Update this
   ];
   ```

2. **Database** (`supabase/migrations/add_analytics_function.sql`):
   ```sql
   RETURN user_email IN (
     'your-email@example.com' -- Update this
   );
   ```

### Step 2: Run Database Migration

1. Go to your Supabase Dashboard → **SQL Editor**
2. Open `supabase/migrations/add_analytics_function.sql`
3. Copy and paste the entire SQL into the SQL Editor
4. **Update the admin email** in the `is_admin_user` function
5. Click **Run**

This migration will:
- Create a function to check if a user is an admin
- Create an RLS policy that allows admins to read all sessions (while regular users still only see their own)
- Create a helper function for aggregate analytics (optional, for future use)

### Step 3: Verify Access

1. Sign in with your admin email
2. Click on your user avatar/email in the top right
3. You should see an **"Analytics"** menu item
4. Click it to open the Analytics Dashboard

## 📊 Dashboard Features

The dashboard includes:

- **Key Metrics Cards**: Total users, sessions, averages, completion rates
- **Monthly Usage Trend**: Area chart showing sessions and active users over time
- **Feedback Type Breakdown**: Pie chart of feedback types
- **Top Industries**: Bar chart of most common ICP industries
- **Top ICP Titles**: Bar chart of most common ICP titles
- **Board Roles Analysis**: Horizontal bar chart of most common board member roles
- **Top Feedback Items**: List of most frequently analyzed feedback items
- **Additional Metrics**: Average report length, board size, competitor analysis usage

## 🔒 Security Notes

- The dashboard only shows **aggregate, anonymous data** - no individual user information is exposed
- Access is restricted to admin users only (checked by email)
- RLS policies ensure regular users can only see their own data
- Admins can see all sessions for analytics purposes, but the dashboard only shows aggregated metrics

## 🐛 Troubleshooting

### "Access denied" error
- Make sure your email is added to the admin list in both `analyticsService.ts` and the database function
- Verify you're signed in with the admin email

### "No data" or empty charts
- This is normal if the app hasn't been used yet or has no completed sessions
- The dashboard will populate as users create sessions

### Permission errors when loading analytics
- Make sure you've run the database migration (`add_analytics_function.sql`)
- The RLS policy allows admins to read all sessions
- Check Supabase logs for any SQL errors

## 📝 Notes

- All data is anonymized - individual user emails or personal data are never shown
- Only completed sessions (status = 'complete') are included in analytics
- Draft sessions are excluded from analytics
- The dashboard updates in real-time as new sessions are created


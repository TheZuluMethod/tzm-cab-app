# Referral System Setup Guide

## Overview
The referral system allows users to refer up to 5 colleagues. When a referred colleague signs up and becomes a paying customer, the referrer gets 1 free month credit for each successful referral.

## Database Setup

### 1. Run the Migration
Execute the SQL migration file to create the referrals table and related functions:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/create_referrals_schema.sql
```

This creates:
- `referrals` table with referral tracking
- `generate_referral_code()` function
- `can_refer_more()` function  
- `apply_referral_credit()` function
- RLS policies for security

### 2. Verify Tables Created
Check that the following tables/columns exist:
- `public.referrals` table
- `public.subscriptions.referral_credits_applied` column
- `public.subscriptions.referral_credits_remaining` column

## Frontend Integration

### Account Panel
The referral section is now available in the Account Details modal:
- View referral statistics
- Send referral emails
- Copy referral link
- Track referral status

### Referral Flow

1. **User Creates Referral**
   - User enters colleague's email in Account Panel
   - System creates referral record with status 'pending'
   - Referral code is generated and stored

2. **Colleague Signs Up**
   - Colleague clicks referral link: `?ref=REFERRAL_CODE`
   - On signup, `trackReferralSignup()` is called
   - Referral status updates to 'signed_up'
   - `referred_user_id` is set

3. **Colleague Converts to Paying Customer**
   - When subscription becomes active, `trackReferralConversion()` should be called
   - Referral status updates to 'converted'
   - `apply_referral_credit()` function is called
   - Referrer gets 1 free month credit
   - Referral status updates to 'credit_applied'

## Integration Points

### Signup Tracking
Already integrated in `services/authService.ts`:
- Automatically tracks referral on signup if `?ref=CODE` is in URL

### Conversion Tracking
**TODO**: Add conversion tracking when subscription is created/upgraded:

```typescript
// In subscriptionService.ts or wherever subscription is created
import { trackReferralConversion } from './referralService';

// After successful subscription creation/upgrade:
await trackReferralConversion(userId);
```

## API Functions

### `createReferral(email: string)`
Creates a new referral for a colleague's email.

### `getReferralStats()`
Returns referral statistics for current user:
- Total referrals
- Pending/Signed up/Converted counts
- Credits applied
- Can refer more (boolean)

### `getUserReferrals()`
Returns all referrals for current user with status.

### `trackReferralSignup(email: string, userId: string)`
Tracks when a referred user signs up.

### `trackReferralConversion(userId: string)`
Tracks when a referred user becomes a paying customer and applies credit.

## Database Functions

### `apply_referral_credit(p_referral_id UUID)`
- Updates referral status to 'credit_applied'
- Increments referrer's `referral_credits_applied` and `referral_credits_remaining`
- Should be called automatically when conversion happens

## Testing

1. **Create Referral**
   - Open Account Panel
   - Enter colleague email
   - Verify referral appears in list

2. **Signup with Referral**
   - Use referral link: `?ref=CODE`
   - Sign up new account
   - Verify referral status updates to 'signed_up'

3. **Conversion**
   - Upgrade referred account to paid
   - Verify referral status updates to 'converted'
   - Verify referrer gets credit

## Notes

- Maximum 5 referrals per user
- Credit is applied automatically when conversion happens
- Referral link format: `https://yourapp.com?ref=REFERRAL_CODE`
- All referral data is stored in Supabase with proper RLS policies


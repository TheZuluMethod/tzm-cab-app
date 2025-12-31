# How to Get Your Stripe Price ID

You provided:
- **Product ID**: `prod_TgSWXxxkLDyRod`
- **Publishable Key**: `mk_1Sj52O31TlaqJv33kGAszWbI`

But you need the **Price ID** (starts with `price_`) to create checkout sessions.

## Steps to Get Price ID

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/products

2. **Find Your Product**:
   - Look for the product with ID `prod_TgSWXxxkLDyRod`
   - Or look for "Monthly Subscription" or similar name

3. **Click on the Product**:
   - This will open the product details page

4. **Find the Price Section**:
   - You'll see a "Pricing" section showing the price (e.g., $99.00/month)
   - Next to the price, you'll see a **Price ID** (starts with `price_`)
   - It will look like: `price_1Sj52J31TlaqJv33...` or similar

5. **Copy the Price ID**:
   - Click on the Price ID to copy it
   - Or manually copy the entire ID

6. **Add to Your `.env` File**:
   ```env
   VITE_STRIPE_PRICE_ID=price_XXXXXXXXXXXXX
   ```

## Alternative: Create a New Price

If you can't find the price or need to create a new one:

1. Go to Stripe Dashboard → Products
2. Click on your product (`prod_TgSWXxxkLDyRod`)
3. Click "Add another price" or "Create price"
4. Set:
   - **Amount**: $99.00
   - **Billing period**: Monthly (recurring)
5. Click "Add price"
6. Copy the new Price ID

## Verify Your Keys

**Note**: Your publishable key format (`mk_...`) is unusual. Stripe publishable keys typically start with:
- `pk_test_...` (for test mode)
- `pk_live_...` (for live mode)

Please verify in Stripe Dashboard → Developers → API Keys that you're using the correct **Publishable key** (not a secret key).

The key should be labeled "Publishable key" in the Stripe dashboard.


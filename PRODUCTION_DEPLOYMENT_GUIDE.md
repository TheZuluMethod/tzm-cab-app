# Production Deployment Guide

**Complete guide for deploying The Zulu Method CAB App to production**

## 🎯 Recommended Deployment Strategy

### **Option 1: Vercel (RECOMMENDED) ⭐**
**Best for**: React/Vite apps, automatic deployments, excellent performance
- ✅ **Free tier**: Generous (100GB bandwidth/month)
- ✅ **Paid**: $20/month (Pro) - includes analytics, better performance
- ✅ **Zero-config**: Auto-detects Vite, handles builds automatically
- ✅ **Edge Network**: Global CDN, fast worldwide
- ✅ **Environment Variables**: Easy UI for managing secrets
- ✅ **Preview Deployments**: Automatic for every PR
- ✅ **Custom Domains**: Free SSL certificates
- ✅ **Analytics**: Built-in performance monitoring

**Why Vercel?**
- Built by the Next.js team, optimized for React apps
- Excellent developer experience
- Automatic HTTPS/SSL
- Great documentation and support
- Integrates seamlessly with GitHub

### **Option 2: Netlify**
**Best for**: JAMstack apps, form handling, serverless functions
- ✅ **Free tier**: 100GB bandwidth/month
- ✅ **Paid**: $19/month (Pro) - similar features to Vercel
- ✅ **Easy setup**: Drag-and-drop or Git integration
- ✅ **Edge Functions**: For serverless needs
- ✅ **Form handling**: Built-in (if needed later)

### **Option 3: Cloudflare Pages**
**Best for**: Cost-conscious, global performance
- ✅ **Free tier**: Unlimited bandwidth (generous!)
- ✅ **Paid**: $20/month (Pro) - advanced features
- ✅ **Global CDN**: Excellent performance worldwide
- ✅ **DDoS Protection**: Built-in security

### **Option 4: AWS Amplify / Azure Static Web Apps**
**Best for**: Enterprise needs, existing cloud infrastructure
- More complex setup
- Better for large-scale deployments
- More control over infrastructure

---

## 📋 Pre-Deployment Checklist

### 1. **Environment Variables Setup**

Create a `.env.production` file (or use platform's UI) with:

```env
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (REQUIRED)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# API Keys (REQUIRED)
VITE_GEMINI_API_KEY=your-production-key
VITE_ANTHROPIC_API_KEY=your-production-key
PERPLEXITY_API_KEY=your-production-key

# SendGrid (REQUIRED)
VITE_SENDGRID_API_KEY=your-production-key

# Optional: Error Reporting
ERROR_REPORT_FROM_EMAIL=errors@thezulumethod.com
```

**⚠️ IMPORTANT**: 
- Use **production** API keys (not development keys)
- Never commit `.env.production` to Git
- Set these in your hosting platform's environment variables UI

### 2. **Supabase Production Setup**

1. **Create Production Project** (if not already done):
   - Go to https://supabase.com
   - Create new project (or use existing)
   - Note: Production projects should be in a region close to your users

2. **Run Migrations**:
   ```bash
   # Install Supabase CLI if needed
   npm install -g supabase
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Push migrations
   supabase db push
   ```

3. **Deploy Edge Functions**:
   ```bash
   # Deploy all functions
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   supabase functions deploy admin-recovery
   ```

4. **Set Edge Function Secrets**:
   ```bash
   # Set Stripe secrets
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Set admin recovery key
   supabase secrets set ADMIN_RECOVERY_KEY=your-secure-random-key
   ```

5. **Configure Stripe Webhook**:
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Copy webhook signing secret to Supabase secrets

### 3. **Stripe Production Setup**

1. **Switch to Live Mode**:
   - Go to Stripe Dashboard
   - Toggle to "Live mode" (top right)
   - Get your live API keys

2. **Create Product & Price**:
   - Products → Add Product
   - Name: "The Zulu Method CAB - Monthly Subscription"
   - Price: $99/month
   - Billing: Recurring monthly
   - Copy the Price ID (e.g., `price_xxxxx`)

3. **Update Code** (if needed):
   - Ensure `create-checkout-session` Edge Function uses the live Price ID
   - Test checkout flow in production

### 4. **Domain Setup**

1. **Purchase Domain** (if needed):
   - Recommended: Namecheap, Google Domains, Cloudflare
   - Domain: `thezulumethod.com` (or your preferred domain)

2. **Configure DNS**:
   - Add CNAME record pointing to your hosting platform
   - Example for Vercel: `cname.vercel-dns.com`
   - Example for Netlify: `your-app.netlify.app`

3. **SSL Certificate**:
   - Most platforms (Vercel, Netlify) provide free SSL automatically
   - Just add your domain in their UI

---

## 🚀 Deployment Steps: Vercel (Recommended)

### Step 1: Prepare Your Repository

1. **Ensure code is pushed to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

### Step 2: Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub (recommended)
3. Import your repository

### Step 3: Configure Project

1. **Project Settings**:
   - Framework Preset: Vite
   - Root Directory: `./` (or leave default)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **Environment Variables**:
   - Go to Settings → Environment Variables
   - Add all variables from `.env.production` (see checklist above)
   - **Important**: Set for "Production" environment
   - Also set for "Preview" if you want PR previews

3. **Custom Domain**:
   - Go to Settings → Domains
   - Add your domain: `cab.thezulumethod.com` or `thezulumethod.com/cab`
   - Follow DNS instructions

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at: `https://your-app.vercel.app`
4. Custom domain will be active after DNS propagates (up to 24 hours)

### Step 5: Verify Deployment

1. **Test Core Features**:
   - ✅ User signup/login
   - ✅ Board generation
   - ✅ Report generation
   - ✅ Stripe checkout
   - ✅ Share functionality
   - ✅ Saved reports

2. **Check Console**:
   - Open browser DevTools
   - Look for errors
   - Verify API calls are working

3. **Test Payments**:
   - Use Stripe test mode first
   - Then switch to live mode
   - Test with real card (use Stripe test cards)

---

## 🚀 Deployment Steps: Netlify (Alternative)

### Step 1: Create Netlify Account

1. Go to https://netlify.com
2. Sign up with GitHub

### Step 2: Deploy Site

1. **Option A: Git Integration** (Recommended):
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository
   - Configure:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

2. **Option B: Drag & Drop**:
   - Run `npm run build` locally
   - Drag `dist` folder to Netlify dashboard

### Step 3: Configure Environment Variables

1. Go to Site Settings → Environment Variables
2. Add all production environment variables
3. Redeploy after adding variables

### Step 4: Custom Domain

1. Go to Domain Settings
2. Add custom domain
3. Configure DNS as instructed

---

## 🔧 Post-Deployment Configuration

### 1. **Update Supabase Auth Redirect URLs**

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to "Redirect URLs":
   - `https://your-domain.com`
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/cab` (if using subpath)

### 2. **Update Stripe Webhook URL**

1. Go to Stripe Dashboard → Webhooks
2. Update webhook endpoint to production URL:
   - `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Test webhook delivery

### 3. **Configure SendGrid**

1. **Verify Sender Domain**:
   - Go to SendGrid → Settings → Sender Authentication
   - Verify `thezulumethod.com` domain
   - Add DNS records as instructed

2. **Create Email Templates**:
   - Use the templates created by `scripts/create-sendgrid-drafts.ts`
   - Or create new ones in SendGrid UI

### 4. **Set Up Monitoring**

**Recommended Tools**:
- **Vercel Analytics**: Built-in (if using Vercel)
- **Sentry**: Error tracking (free tier available)
- **Google Analytics**: User analytics
- **Supabase Dashboard**: Database monitoring

### 5. **Set Up Backups**

- **Supabase**: Automatic daily backups (included)
- **Code**: GitHub repository (already backed up)
- **Environment Variables**: Document in secure password manager

---

## 💰 Cost Estimates

### **Minimum Viable Production** (Free Tier):
- **Hosting**: $0 (Vercel/Netlify free tier)
- **Supabase**: $0 (free tier: 500MB database, 2GB bandwidth)
- **Stripe**: 2.9% + $0.30 per transaction
- **SendGrid**: $0 (free tier: 100 emails/day)
- **Domain**: ~$12/year
- **Total**: ~$12/year + transaction fees

### **Recommended Production** (Paid):
- **Hosting**: $20/month (Vercel Pro)
- **Supabase**: $25/month (Pro plan)
- **Stripe**: 2.9% + $0.30 per transaction
- **SendGrid**: $19.95/month (Essentials)
- **Domain**: ~$12/year
- **Total**: ~$65/month + transaction fees

### **API Costs** (Pay-as-you-go):
- **Gemini API**: ~$0.001-0.01 per report (depends on usage)
- **Perplexity API**: ~$0.01-0.05 per report
- **Claude API**: ~$0.01-0.03 per report
- **Estimated**: $0.02-0.08 per report generated

---

## 🔒 Security Checklist

- [ ] All API keys are in environment variables (not hardcoded)
- [ ] Production API keys are different from development keys
- [ ] `.env.production` is in `.gitignore`
- [ ] Supabase RLS policies are enabled
- [ ] Stripe webhook signature verification is enabled
- [ ] HTTPS/SSL is enabled (automatic on most platforms)
- [ ] CORS is properly configured
- [ ] Rate limiting is configured (if needed)
- [ ] Admin recovery key is stored securely
- [ ] Database backups are enabled

---

## 🐛 Troubleshooting

### **Build Fails**
- Check build logs in deployment platform
- Verify all environment variables are set
- Ensure `package.json` scripts are correct
- Check for TypeScript errors: `npm run type-check`

### **API Calls Fail**
- Verify environment variables are set correctly
- Check browser console for errors
- Verify CORS settings in Supabase
- Check API key quotas/limits

### **Stripe Checkout Not Working**
- Verify Stripe keys are for correct mode (live vs test)
- Check webhook endpoint is correct
- Verify Edge Function is deployed
- Check Stripe dashboard for errors

### **Database Errors**
- Verify Supabase connection string
- Check RLS policies
- Verify migrations are applied
- Check Supabase dashboard for errors

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html

---

## 🎯 Next Steps After Deployment

1. **Test Everything**: Go through entire user flow
2. **Monitor Performance**: Set up analytics and error tracking
3. **Set Up Alerts**: Get notified of errors/issues
4. **Optimize**: Monitor API costs and optimize usage
5. **Scale**: As you grow, consider upgrading plans

---

## ✅ Quick Start Commands

```bash
# Build locally to test
npm run build
npm run preview

# Deploy to Vercel (if using Vercel CLI)
npm i -g vercel
vercel --prod

# Deploy Supabase functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy admin-recovery
```

---

**Ready to deploy? Start with Vercel - it's the fastest path to production!**


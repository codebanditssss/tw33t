# 🚀 Dodo Payments Setup Guide

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Dodo Payments Configuration
DODO_PAYMENTS_API_URL=https://test.dodopayments.com
DODO_PAYMENTS_API_KEY=your_dodo_api_key
DODO_WEBHOOK_SECRET=your_dodo_webhook_secret
DODO_PRO_PRODUCT_ID=your_pro_product_id_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenRouter API (for AI features)
OPENROUTER_API_KEY=your_openrouter_api_key
```

## 🔧 Setup Steps

### 1. Supabase Setup
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Get your project URL and anon key from Settings > API
3. Get your service role key from Settings > API (keep this secret!)

### 2. Dodo Payments Setup
1. Sign up at [Dodo Payments](https://dodopayments.com)
2. Create a new project
3. Get your API key from the dashboard
4. Create a product for your Pro plan ($5.99/month)
5. Set up webhook endpoint: `https://yourdomain.com/api/subscription/webhook`
6. Get webhook secret from webhook settings

### 3. Database Migration
The following tables have been created via Supabase migrations:

- `user_subscriptions` - Tracks user subscription status
- `monthly_usage` - Tracks tweet generation usage per month
- `payment_history` - Records all payment transactions

### 4. Webhook Configuration
In your Dodo Payments dashboard:
- Webhook URL: `https://yourdomain.com/api/subscription/webhook`
- Events to subscribe to:
  - `subscription.created`
  - `subscription.updated` 
  - `subscription.cancelled`
  - `payment.succeeded`
  - `payment.failed`

## 🌐 Production Deployment

### Environment Variables for Production:
```env
# Change these for production:
DODO_PAYMENTS_API_URL=https://live.dodopayments.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Vercel Deployment:
1. Connect your GitHub repo to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy!

### Other Platforms:
- **Netlify**: Add env vars in Site Settings > Environment Variables
- **Railway**: Add env vars in Variables tab
- **Heroku**: Use `heroku config:set` commands

## 🔒 Security Notes

1. **Never expose service role keys** in client-side code
2. **Validate webhook signatures** (already implemented)
3. **Use HTTPS** in production for webhook endpoints
4. **Rotate API keys** regularly

## 🧪 Testing

### Test the Payment Flow:
1. Start dev server: `npm run dev`
2. Go to `/pricing`
3. Click "Upgrade to Pro"
4. Use Dodo Payments test card numbers
5. Verify webhook receives events
6. Check database for subscription records

### Test Webhook Locally:
Use ngrok or similar to expose localhost:
```bash
ngrok http 3000
# Use the ngrok URL for webhook endpoint during testing
```

## 📊 Features Implemented

✅ **2-Tier Pricing System**
- Free Plan: 50 tweets/month - $0
- Pro Plan: 500 tweets/month - $5.99

✅ **Usage Tracking**
- Real-time usage monitoring
- Monthly usage limits
- Usage increment after generation

✅ **Payment Processing**
- Dodo Payments integration
- Secure webhook handling
- Subscription lifecycle management

✅ **UI/UX**
- Credits display in header
- Clean pricing page
- Success/error handling
- Real-time updates

✅ **Database Schema**
- User subscriptions tracking
- Monthly usage records
- Payment history logging

## 🆘 Troubleshooting

### Common Issues:

**401 Unauthorized errors:**
- Check Supabase environment variables
- Verify user is logged in
- Check cookie configuration

**Webhook not receiving events:**
- Verify webhook URL is accessible
- Check webhook secret matches
- Ensure HTTPS in production

**Payment not updating subscription:**
- Check webhook event handling
- Verify database permissions
- Check Dodo product ID matches

**Usage not updating:**
- Check API route authentication
- Verify database table structure
- Check usage increment logic

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify all environment variables are set
4. Test webhook endpoint manually
5. Check Dodo Payments dashboard for event logs

---

🎉 **Congratulations!** Your tw33t app now has a complete payment and subscription system! 
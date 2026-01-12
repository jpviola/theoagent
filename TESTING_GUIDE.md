# 🧪 TheoAgent Complete Setup Testing Guide

## ✅ STEP 3: Test Your Complete Setup

Your TheoAgent application is now fully configured! Here's how to test everything:

### 1. **Database Connection Test**
- **Visit**: http://localhost:3000
- **Look for**: Database status indicator in the top-left accessibility bar
- **Expected**: Green "Database connected ✅" indicator
- **If error**: Check that you ran the SQL script correctly in Supabase

### 2. **Authentication Flow Test**

#### **Create New User Account:**
1. **Go to**: http://localhost:3000
2. **Look for**: Sign Up button (usually in top-right or center)
3. **Create account with**: 
   - Email: `test@example.com` 
   - Password: `TestPassword123!`
4. **Check email**: Look for verification email from Supabase
5. **Verify account**: Click link in email

#### **Verify in Supabase Dashboard:**
1. **Authentication → Users**: Should show your new user
2. **Table Editor → profiles**: Should show automatically created profile
3. **Profile should have**:
   - `id`: Matching user ID
   - `full_name`: Your email or name
   - `subscription_tier`: 'free'
   - `usage_count_today`: 0

### 3. **Chat Functionality Test**

#### **Basic Chat Test:**
1. **Sign in** with your test account
2. **Send a message**: "Hello, can you help me understand Catholic teachings?"
3. **Expected**: AI response with Catholic theological content
4. **Check**: Response uses theological sources from your database

#### **Advanced Features Test:**
1. **Language selector**: Try switching between English/Spanish
2. **Chat modes**: Try different modes (standard, priest, academic)
3. **Subscription limits**: Free tier should have daily message limits

### 4. **User Profile Test**
1. **Complete onboarding**: Fill out role, interests, experience
2. **Check profile updates**: Verify changes save to database
3. **Test settings**: Update name, institution, etc.

### 5. **Subscription System Test**
1. **Usage tracking**: Send several messages, check usage counter
2. **Tier limits**: Try to exceed free tier limits
3. **Upgrade prompts**: Should see upgrade suggestions for premium features

## 🔍 Troubleshooting Guide

### **Database Issues:**
- ❌ **Red database indicator**: Check Supabase URL and keys in .env.local
- ❌ **"User not found" errors**: Verify SQL script ran successfully
- ❌ **RLS policy errors**: Check Row Level Security policies in Supabase

### **Authentication Issues:**
- ❌ **Sign up fails**: Check Supabase Auth settings (Site URL, Redirect URLs)
- ❌ **Email not sent**: Check Supabase email templates and SMTP settings
- ❌ **Login redirect fails**: Verify callback URL configuration

### **Chat Issues:**
- ❌ **"Unauthorized" errors**: Check user is properly authenticated
- ❌ **Empty responses**: Check Anthropic API key is valid
- ❌ **Slow responses**: Normal for first request (cold start)

## 📊 Success Indicators

### ✅ **Fully Working Setup:**
- Green database connection indicator
- Users can sign up and sign in
- New user profiles auto-created in database
- Chat responses work with theological content
- Usage tracking functions properly
- Different subscription tiers work correctly

### ✅ **Database Tables Populated:**
- `profiles`: Your test user profile
- `theological_sources`: Sample Catholic teachings
- `daily_gospel_readings`: Today's Gospel reading
- `conversations`: Chat history tracking

## 🚀 Next Steps After Testing

Once everything works:

1. **Production Deployment**: Deploy to Vercel/AWS
2. **Add More Content**: Expand theological sources database
3. **Payment Integration**: Set up Stripe for subscriptions
4. **Email Setup**: Configure transactional emails
5. **Analytics**: Add user behavior tracking
6. **Performance**: Optimize for production use

## 🎯 Quick Test Commands

**Browser Console Tests:**
```javascript
// Test database connection
fetch('/api/test-db').then(r => r.json()).then(console.log)

// Test user profile
fetch('/api/user/profile').then(r => r.json()).then(console.log)
```

**Expected Results:**
- Database test: `{"success": true, "message": "Database connection successful! ✅"}`
- Profile test: User profile data or authentication prompt

Your TheoAgent is ready for production! 🎉
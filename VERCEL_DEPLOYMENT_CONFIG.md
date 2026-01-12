# 🚀 Vercel Deployment Configuration for SantaPalabra

## 🎯 Important: Configure These Environment Variables in Vercel

Go to your **theoAgent** project in Vercel Dashboard and add these environment variables:

### 🔑 **REQUIRED for AI Gateway (Recommended)**
```bash
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_api_key_here
```

### 🤖 **AI Provider Keys (Need at least one)**
```bash
# Option 1: OpenAI (Recommended for production)
OPENAI_API_KEY=sk-your-openai-key-here

# Option 2: Anthropic Claude (Alternative)  
ANTHROPIC_API_KEY=your-anthropic-key-here
```

### 🗄️ **Your Existing Supabase Config**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 🔐 **Authentication (if using)**
```bash
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

## 📋 **Step-by-Step Vercel Setup**

### 1. **Get Vercel AI Gateway Key**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **theoAgent** project
3. Go to **Settings** → **AI Gateway** 
4. Click **"Generate API Key"**
5. Copy the key and add as `AI_GATEWAY_API_KEY`

### 2. **Add Environment Variables**
1. In your theoAgent project → **Settings** → **Environment Variables**
2. Add each variable above
3. Make sure to select **Production**, **Preview**, and **Development** for each

### 3. **Redeploy (if needed)**
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Select **"Use existing Build Cache"**

## ✅ **Verification**

Once deployed, test these endpoints:

```bash
# Health check  
https://your-domain.vercel.app/api/catholic-rag

# Catholic AI query
curl -X POST https://your-domain.vercel.app/api/catholic-rag \
  -H "Content-Type: application/json" \
  -d '{"query": "¿Qué enseña la Iglesia sobre la oración?"}'
```

## 🎉 **Expected Benefits**

With Vercel AI Gateway, your SantaPalabra will have:
- ⚡ Better response times
- 🛡️ Automatic retry on failures  
- 📊 Better monitoring and logs
- 💰 Optimized costs
- 🚀 Production reliability

## 🆘 **If You Get Errors**

**"No AI model configuration"** → Add `AI_GATEWAY_API_KEY` + at least one AI provider key
**"Service unavailable"** → Check if environment variables are properly set
**Build errors** → The code is ready, likely a config issue

---

**¡Tu catequista digital hispanoamericano estará en línea pronto!** 🙏✨
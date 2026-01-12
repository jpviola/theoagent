# 🚀 Vercel AI Gateway Setup Guide for SantaPalabra

## What is Vercel AI Gateway?

Vercel AI Gateway provides a unified interface to multiple AI providers with improved reliability, better error handling, connection pooling, and monitoring. Perfect for production deployments!

## ✅ Benefits You'll Get

1. **Better Reliability**: Automatic retries and error handling
2. **Unified Interface**: Switch between AI providers seamlessly  
3. **Improved Performance**: Connection pooling and optimizations
4. **Better Monitoring**: Centralized logging and metrics
5. **Cost Optimization**: Efficient request handling

## 🔧 Setup Steps

### Step 1: Get Your Vercel AI Gateway API Key

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your SantaPalabra project
3. Go to **Settings** → **AI Gateway**
4. Click **"Generate API Key"**
5. Copy the generated key

### Step 2: Update Your Environment Variables

Add to your `.env.local` file:

```bash
# Vercel AI Gateway (REQUIRED)
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key_here

# AI Provider Keys (You need at least one)
OPENAI_API_KEY=your_openai_key_here        # Recommended for production
ANTHROPIC_API_KEY=your_anthropic_key_here  # Alternative/fallback

# Your existing Supabase config...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Step 3: Deploy to Vercel (Automatic Setup)

When you deploy to Vercel, the `VERCEL_OIDC_TOKEN` is automatically provided, making the setup even simpler in production.

```bash
git add .
git commit -m "feat: Add Vercel AI Gateway support for better reliability"
git push origin main
```

## 🤖 How It Works Now

Your SantaPalabra app now has intelligent AI model selection:

1. **First Priority**: Vercel AI Gateway + OpenAI (most reliable for production)
2. **Second Priority**: Vercel AI Gateway + Anthropic Claude
3. **Fallback 1**: Direct Anthropic API calls
4. **Fallback 2**: Direct OpenAI API calls

## 🧪 Testing Your Setup

Test the Catholic RAG API with the enhanced setup:

```bash
# Test the enhanced API
curl -X POST http://localhost:3000/api/catholic-rag \
  -H "Content-Type: application/json" \
  -d '{"query": "¿Qué enseña la Iglesia sobre la oración?"}'
```

You should see logs indicating which AI provider is being used:

- `🔥 Using Vercel AI Gateway` - Perfect! Gateway is active
- `🔄 Falling back to direct API calls` - Still works, but consider adding gateway
- `🤖 Using OpenAI directly` or `🤖 Using Anthropic Claude directly` - Direct API mode

## 🎯 Expected Response

```json
{
  "response": "La Iglesia Católica enseña que la oración es...",
  "sources": ["catechism", "papal_magisterium"],
  "confidence": 0.95,
  "model": "Enhanced Catholic RAG with Vercel AI Gateway",
  "timestamp": "2026-01-12T15:45:00Z"
}
```

## 🔍 Health Check

Check API status:
```bash
curl http://localhost:3000/api/catholic-rag
```

## 🚨 Troubleshooting

### Error: "No AI model configuration found"
- **Cause**: Missing API keys
- **Solution**: Add `AI_GATEWAY_API_KEY` + at least one model key (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`)

### Error: "AI service configuration incomplete"  
- **Cause**: Gateway key present but no model keys
- **Solution**: Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

### Warning: "Failed to initialize through AI Gateway"
- **Cause**: Network issues or invalid gateway key
- **Solution**: Check gateway key, system falls back to direct API calls automatically

## 📊 Monitoring

Once deployed with Vercel AI Gateway, you can monitor:
- Request volume and latency
- Error rates by provider
- Cost optimization opportunities
- Usage patterns

## 🎉 What's Improved

Your SantaPalabra Catholic AI assistant now has:

✅ **Better reliability** for production deployments
✅ **Automatic failover** between AI providers  
✅ **Enhanced error handling** and retries
✅ **Improved performance** through connection pooling
✅ **Production-ready** Vercel deployment support

## 🔗 Resources

- [Vercel AI Gateway Documentation](https://vercel.com/docs/ai-gateway)
- [LangChain Integration Guide](https://vercel.com/docs/ai-gateway/framework-integrations/langchain)
- [SantaPalabra Documentation](./README.md)

---

**¡Tu catequista digital hispanoamericano está listo para el mundo!** 🙏✨
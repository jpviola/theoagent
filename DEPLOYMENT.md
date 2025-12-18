# Pre-Deployment Checklist

## 🔒 Security (CRITICAL)

- [ ] ✅ API keys are in `.env.local` (NOT committed to git)
- [ ] ✅ Add `.env.local` to `.gitignore`
- [ ] Configure environment variables on hosting platform
- [ ] Verify API key is not visible in client-side code

## 🎨 User Experience

- [ ] ✅ Beautiful UI with logo
- [ ] ✅ Error messages display properly
- [ ] ✅ Loading states work
- [ ] Add a "Beta" or "Preview" label (optional)
- [ ] Add disclaimer about AI limitations (optional)

## 🧪 Testing

- [ ] Test chat functionality on localhost:3000
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile device
- [ ] Verify markdown rendering works
- [ ] Test error handling (disconnect internet, test)

## 🚀 Deployment Setup

### Option A: Vercel (Recommended - Easiest)
1. Create account at vercel.com
2. Install Vercel CLI: `npm i -g vercel`
3. Run: `vercel` in project folder
4. Add environment variables in dashboard
5. Done! Auto-deploys on git push

### Option B: Netlify
1. Create account at netlify.com
2. Connect GitHub repo
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables

### Option C: Railway/Render/Fly.io
- Good alternatives, similar process
- Add ANTHROPIC_API_KEY in dashboard

## 📝 Post-Deployment

- [ ] Test production URL
- [ ] Verify API calls work
- [ ] Check browser console for errors
- [ ] Test on mobile
- [ ] Share with 1-2 friends for feedback

## 🔄 Ongoing Development

**After deploying:**
- Continue working locally on RAG
- Use `git` branches for features
- Deploy updates via git push (Vercel) or redeploy button
- Keep iterating!

---

## Quick Deploy Command (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (first time - will ask questions)
vercel

# Future deploys (instant)
vercel --prod
```

Then in Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add: `ANTHROPIC_API_KEY` = `your-key-here`
3. Add: `BIBLE_API_KEY` = `your-key-here`
4. Redeploy

---

## ⚠️ IMPORTANT: .gitignore Check

Make sure `.env.local` is in `.gitignore` before pushing to GitHub!

```bash
# Check if .env.local is in .gitignore
cat .gitignore | grep .env.local

# If not found, add it:
echo ".env.local" >> .gitignore
```

# Deployment Guide

## Complete Step-by-Step Deployment Instructions

### Prerequisites

1. **GitHub Account** - To host your code
2. **HuggingFace Account** - For LLM API ([Sign up](https://huggingface.co/join))
3. **Render Account** - For backend hosting ([Sign up](https://render.com))
4. **Vercel Account** - For frontend hosting ([Sign up](https://vercel.com))

---

## Step 1: Get HuggingFace API Token

1. Go to [HuggingFace Settings](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Name: `papermind-api`
4. Type: `Read`
5. Copy the token (starts with `hf_...`)

---

## Step 2: Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Papermind deployment ready"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/papermind.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Backend on Render

### 3.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** (if first time)
4. Find and select your `papermind` repository

### 3.2 Configure Service

Fill in the following:

| Field | Value |
|-------|-------|
| **Name** | `papermind-backend` (or your choice) |
| **Region** | Oregon (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | `Python 3` |
| **Build Command** | `cd backend && pip install -r requirements.txt` |
| **Start Command** | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` |

### 3.3 Add Environment Variables

1. Scroll down to **"Environment Variables"**
2. Click **"Add Environment Variable"**
3. Add:
   - **Key**: `HF_TOKEN`
   - **Value**: Your HuggingFace token from Step 1

### 3.4 Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. You'll see logs in real-time
4. Once deployed, you'll see: ✅ **Your service is live**

### 3.5 Get Backend URL

Copy your backend URL (e.g., `https://papermind-backend-xyz.onrender.com`)

**Test it:**
```bash
curl https://YOUR_BACKEND_URL.onrender.com/health
# Should return: {"status":"ok"}
```

---

## Step 4: Deploy Frontend on Vercel

### 4.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your `papermind` repository

### 4.2 Configure Project

| Field | Value |
|-------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` (click Edit, then select folder) |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `dist` (auto-detected) |

### 4.3 Add Environment Variable

1. Click **"Environment Variables"** (expand section)
2. Add variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Render backend URL (from Step 3.5)
   - **Example**: `https://papermind-backend-xyz.onrender.com`

### 4.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Once deployed, click **"Visit"** to open your app

### 4.5 Get Frontend URL

Copy your frontend URL (e.g., `https://papermind-abc123.vercel.app`)

---

## Step 5: Update README with Your Links

Edit `README.md` and replace placeholder URLs:

```markdown
[![Live Demo](https://img.shields.io/badge/Demo-Live-success)](https://YOUR_FRONTEND.vercel.app)
[![Backend API](https://img.shields.io/badge/API-Deployed-blue)](https://YOUR_BACKEND.onrender.com)

**[🚀 Try Live Demo](https://YOUR_FRONTEND.vercel.app)**
```

Commit and push:
```bash
git add README.md
git commit -m "Update README with live deployment URLs"
git push
```

---

## Step 6: Test Your Deployment

1. **Visit Frontend**: `https://YOUR_FRONTEND.vercel.app`
2. **Upload a Test Paper**:
   - Try arXiv URL: `2103.14030` (CLIP paper)
   - Or upload a sample PDF
3. **Ask a Question**:
   - "What is this paper about?"
   - Wait for streaming response
4. **Check Sources**: View retrieved chunks and metrics

---

## Step 7: Add to LinkedIn

### Post Template

```
🚀 Excited to share my latest project: Papermind - AI Research Paper Assistant!

Built a full-stack RAG application that lets you chat with research papers:

✅ Upload PDFs or fetch from arXiv
✅ Ask questions, get AI-powered answers
✅ Real-time streaming with source citations
✅ Quality metrics (faithfulness, relevancy, precision)

🛠️ Tech Stack:
• Frontend: React + Vite + Tailwind (Vercel)
• Backend: FastAPI + ChromaDB (Render)  
• ML: HuggingFace Mistral-7B + Sentence Transformers

🎯 Try it yourself: https://YOUR_FRONTEND.vercel.app

💻 Source: https://github.com/YOUR_USERNAME/papermind

#MachineLearning #AI #RAG #FullStack #Python #React
```

### LinkedIn Profile Section

Add to **Projects** section:

**Papermind - AI Research Assistant**
*[Month Year] - Present*

An AI-powered research assistant using Retrieval-Augmented Generation (RAG) to help researchers understand academic papers through natural conversation.

• Architected full-stack RAG system with React frontend and FastAPI backend
• Implemented vector search with ChromaDB and semantic embeddings
• Integrated HuggingFace Mistral-7B for contextual question answering
• Deployed on Vercel (frontend) and Render (backend) with CI/CD

**Live Demo**: https://YOUR_FRONTEND.vercel.app
**Source**: https://github.com/YOUR_USERNAME/papermind

---

## Troubleshooting

### Backend Issues

**Build fails on Render:**
- Check `backend/requirements.txt` is present
- Verify build command: `cd backend && pip install -r requirements.txt`
- Check logs for specific error

**Backend returns 500 errors:**
- Check environment variable `HF_TOKEN` is set
- View logs in Render dashboard
- Test HuggingFace token: `curl -H "Authorization: Bearer YOUR_TOKEN" https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2`

**Cold start is slow:**
- Expected on free tier (30-60s)
- First request warms up service
- Consider upgrading plan for production

### Frontend Issues

**Build fails on Vercel:**
- Check root directory is set to `frontend`
- Verify `package.json` exists in frontend folder
- Check build logs for errors

**Can't connect to backend:**
- Verify `VITE_API_URL` environment variable
- Check backend health: `curl YOUR_BACKEND_URL/health`
- Open browser console (F12) to see CORS/network errors

**CORS errors:**
- Backend has `allow_origins=["*"]` - should work
- If issues persist, update backend CORS to whitelist your frontend URL

### HuggingFace API Issues

**Model loading timeout:**
- First request can take 10-20s (model warm-up)
- Try again after 30 seconds
- Check HuggingFace status page

**Rate limit errors:**
- Free tier has rate limits
- Wait a few minutes and try again
- Consider HuggingFace Pro for higher limits

---

## Maintenance

### Update Backend

```bash
# Make changes to backend code
git add backend/
git commit -m "Update backend feature"
git push

# Render auto-deploys on push
```

### Update Frontend

```bash
# Make changes to frontend code
git add frontend/
git commit -m "Update frontend UI"
git push

# Vercel auto-deploys on push
```

### Monitor Usage

- **Render**: Dashboard shows hours used (750/month free)
- **Vercel**: Dashboard shows bandwidth and builds
- **HuggingFace**: Check API usage in account settings

---

## Cost Breakdown

| Service | Free Tier | Paid Tier (Optional) |
|---------|-----------|----------------------|
| **HuggingFace** | Free API | Pro: $9/mo for higher limits |
| **Render** | 750 hrs/mo | Starter: $7/mo (always-on) |
| **Vercel** | Unlimited | Pro: $20/mo (team features) |
| **Total** | **$0/month** | ~$16-36/month (if needed) |

---

## Next Steps

After deployment:

1. ✅ Test with multiple papers
2. ✅ Share with colleagues for feedback
3. ✅ Add to your portfolio/resume
4. ✅ Include in LinkedIn projects
5. ⭐ Star repos you used (HuggingFace, ChromaDB, etc.)

---

## Support

If you encounter issues:

1. Check logs in Render/Vercel dashboards
2. Test backend health endpoint
3. Review this troubleshooting guide
4. Open GitHub issue with error details

---

Good luck with your deployment! 🚀

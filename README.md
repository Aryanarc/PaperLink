# Papermind - AI Research Paper Assistant 📚🤖

> Chat with your research papers using AI-powered RAG (Retrieval Augmented Generation)

[![Live Demo](https://img.shields.io/badge/Demo-Live-success)](https://papermind.vercel.app)
[![Backend API](https://img.shields.io/badge/API-Deployed-blue)](https://papermind-backend.onrender.com)

**[🚀 Try Live Demo](https://papermind.vercel.app)** | **[📖 API Docs](https://papermind-backend.onrender.com/docs)**

---

## Overview

Papermind is an intelligent research assistant that helps you understand academic papers through natural conversation. Upload PDFs or fetch papers from arXiv, then ask questions and get AI-powered answers grounded in the paper's content.

### Key Features

- 📄 **PDF Upload** - Drag and drop research papers
- 🔗 **arXiv Integration** - Fetch papers directly by URL or ID
- 💬 **Contextual Q&A** - Ask questions, get answers with source citations
- 🎯 **RAG Architecture** - Retrieval-Augmented Generation for accurate responses
- 🌊 **Streaming Responses** - Real-time answer generation
- 📊 **Quality Metrics** - Live faithfulness, relevancy, and precision scores

---

## Architecture

```
┌─────────────────┐
│  React + Vite   │  Frontend (Vercel)
│   + Tailwind    │
└────────┬────────┘
         │
         │ HTTPS/SSE
         ▼
┌─────────────────┐
│     FastAPI     │  Backend (Render)
│   + ChromaDB    │
└────────┬────────┘
         │
         ├─── Sentence Transformers (Embeddings)
         │
         └─── HuggingFace Inference API (Mistral-7B)
```

### Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS
- Server-Sent Events (SSE) for streaming

**Backend:**
- FastAPI
- ChromaDB (vector database)
- Sentence Transformers (all-MiniLM-L6-v2)
- HuggingFace Inference API (Mistral-7B-Instruct)
- LangChain for text processing

---

## Quick Start

### Deploy Backend (Render)

1. Fork this repo
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. New → Web Service → Connect your repo
4. Configure:
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variable**: `HF_TOKEN` = your HuggingFace token ([get one](https://huggingface.co/settings/tokens))
5. Deploy!

### Deploy Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import your repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Environment Variable**: `VITE_API_URL` = your Render backend URL
4. Deploy!

---

## Local Development

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Add HF_TOKEN to .env
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## Usage

1. **Upload**: Drop a PDF or paste arXiv URL (e.g., `2103.14030`)
2. **Ask**: "What's the main contribution?" / "Explain the methodology"
3. **Explore**: View sources and quality metrics

---

## API Endpoints

```bash
POST /ingest          # Upload PDF
POST /ingest-arxiv    # Fetch from arXiv  
POST /query           # Ask question (SSE stream)
GET  /health          # Health check
POST /clear           # Clear database
```

Full docs: `https://your-backend.onrender.com/docs`

---

## For Interviewers

This project demonstrates:

✅ **Full-Stack** - React + FastAPI  
✅ **ML/AI** - RAG with vector search  
✅ **Cloud** - Production deployment (free tier)  
✅ **Real-Time** - SSE streaming  
✅ **Modern Stack** - Vite, Tailwind, ChromaDB  

**Live Demo**: Try it before our conversation!

---

## Configuration

**Backend** (`.env`):
```env
HF_TOKEN=your_huggingface_token
```

**Frontend** (`.env`):
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## Performance

- **HuggingFace Free Tier**: Free API, rate limits apply
- **Render Free**: 750hrs/month, sleeps after 15min (cold start: ~30s)
- **Vercel Free**: Unlimited deployments, instant scaling

---

## License

MIT - Use for learning and portfolios

---

## Contact

**Your Name**  
[LinkedIn](https://linkedin.com/in/yourprofile) | [GitHub](https://github.com/yourusername)

---

**Built with ❤️ for researchers and AI enthusiasts**

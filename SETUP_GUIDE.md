# 🚀 VisioLingua RAG Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following accounts and tools:

1. **Python 3.12+** installed
2. **Node.js 18+** installed
3. **Clerk Account** - Sign up at [clerk.com](https://clerk.com)
4. **Google AI Studio** - Get API key at [aistudio.google.com](https://aistudio.google.com)
5. **Qdrant Cloud** - Create account at [qdrant.tech](https://qdrant.tech)

---

## 🔑 Step 1: Get Your API Keys

### Clerk Setup (Single Application for Both)
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application (e.g., "VisioLingua")
3. Copy these keys:
   - **Publishable Key** (starts with `pk_test_...`) - for frontend
   - **Secret Key** (starts with `sk_test_...`) - for backend

### Google Gemini API
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Copy the key (starts with `AIza...`)

### Qdrant Cloud
1. Sign up at [Qdrant Cloud](https://cloud.qdrant.io)
2. Create a new cluster (free tier available)
3. Copy the **Cluster URL** (e.g., `https://xyz.qdrant.cloud:6333`)
4. Copy the **API Key** from cluster settings

---

## ⚙️ Step 2: Configure Environment Variables

### Backend Configuration

Create `backend/.env` file:
```bash
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
GEMINI_API_KEY=AIza_your_gemini_api_key_here
QDRANT_URL=https://your-cluster.qdrant.cloud:6333
QDRANT_API_KEY=your_qdrant_api_key_here
```

### Frontend Configuration

Create `frontend/.env.local` file:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Note**: Use the **same Clerk application** for both backend and frontend!

---

## 📦 Step 3: Install Dependencies

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Download NLTK data (will happen automatically on first run)
python -c "import nltk; nltk.download('punkt')"
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install --legacy-peer-deps
```

---

## 🏃 Step 4: Run the Application

### Terminal 1 - Start Backend

```bash
cd backend
python main.py
```

You should see:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
Created Qdrant collection: visiolingua
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Terminal 2 - Start Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 15.0.0
- Local:        http://localhost:3000

✓ Ready in 2.8s
```

---

## 🌐 Step 5: Access the Application

1. Open your browser and go to: **http://localhost:3000**
2. Click "Sign In" to authenticate via Clerk
3. Start uploading images/text and querying!

---

## ✅ Troubleshooting

### Issue: "Missing publishableKey" Error

**Solution**: Make sure `frontend/.env.local` has the correct Clerk publishable key:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Issue: Backend can't connect to Qdrant

**Solution**: 
1. Verify your Qdrant cluster is running
2. Check `QDRANT_URL` includes the port (`:6333`)
3. Ensure `QDRANT_API_KEY` is correct

### Issue: "spaCy model not found"

**Solution**: This is handled automatically with a fallback. The app will use simple text preprocessing if spaCy model is missing.

### Issue: CORS errors in browser

**Solution**: Backend is already configured to allow `localhost:3000`. Make sure backend is running on port 8000.

---

## 🐳 Docker Deployment (Optional)

If you prefer Docker:

```bash
# Make sure .env files are configured first
docker-compose up --build
```

---

## 📊 Testing the Features

1. **Upload**: Drag and drop images or enter text
2. **Query**: Search for similar content in multiple languages
3. **Story Generator**: Create AI-generated stories
4. **Dashboard**: View performance metrics and history

---

## 🔒 Important Notes

- **Single Clerk App**: You only need ONE Clerk application for both frontend and backend
- **Environment Files**: Never commit `.env` or `.env.local` files to version control
- **Free Tiers**: All services (Clerk, Gemini, Qdrant) offer free tiers for development
- **Port Conflicts**: Ensure ports 3000 (frontend) and 8000 (backend) are available

---

## 🆘 Need Help?

If you encounter issues:
1. Check that all environment variables are set correctly
2. Ensure all dependencies are installed
3. Verify API keys are active and have proper permissions
4. Check console logs for specific error messages

---

Happy coding! 🎉
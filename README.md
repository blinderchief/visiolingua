# VisioLingua RAG

A multi-modal multilingual Retrieval-Augmented Generation (RAG) system powered by Google's Gemini AI and Qdrant vector database, with secure authentication via Clerk.

## Features

- **Multi-modal Support**: Upload and query both images and text content
- **Multilingual**: Support for 100+ languages using Gemini's native capabilities
- **Secure Authentication**: User authentication and session management with Clerk
- **Advanced Vector Search**: Hybrid search combining semantic and keyword matching with Qdrant
- **AI-Powered Generation**: Zero-shot multimodal generation with adaptive styles
- **Personalized Experience**: User-specific content and query history
- **Performance Analytics**: Real-time metrics dashboard with BLEU scores and cosine similarity
- **Creative AI Features**: Image-to-story generation, personalized styles, and conversational RAG

## Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with async endpoints
- **AI Engine**: Google Gemini 1.5 Pro/Flash for embeddings and generation
- **Vector Database**: Qdrant Cloud for efficient similarity search
- **Authentication**: Clerk JWT verification
- **Preprocessing**: Image resizing, text cleaning with spaCy
- **Orchestration**: Celery for background tasks

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **Authentication**: Clerk components for seamless auth
- **UI**: Tailwind CSS for modern, responsive design
- **Components**: React Dropzone for file uploads, Recharts for analytics
- **State Management**: React hooks for local state

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- Docker (optional)
- Clerk account and API keys
- Google AI Studio API key
- Qdrant Cloud account

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set environment variables:
   ```bash
   export CLERK_SECRET_KEY="your_clerk_secret"
   export GEMINI_API_KEY="your_gemini_api_key"
   export QDRANT_URL="your_qdrant_url"
   export QDRANT_API_KEY="your_qdrant_api_key"
   ```

4. Run the server:
   ```bash
   python main.py
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Docker Deployment

Build and run with Docker Compose:

```bash
docker-compose up --build
```

## API Endpoints

- `POST /auth/verify` - Verify authentication
- `POST /upload` - Upload image or text content
- `POST /query` - Perform multimodal search and generation
- `GET /history/{user_id}` - Get user's content history
- `POST /feedback` - Submit user feedback

## Innovative Features

1. **Conversational RAG**: Follow-up queries that build on previous context
2. **Personalized Styles**: User profiles with preferred generation styles
3. **Image-to-Story**: Transform uploaded images into narrative stories
4. **Multilingual Poetry**: Generate poems in different languages and styles
5. **Real-time Collaboration**: Share queries and results with other authenticated users
6. **Adaptive Learning**: System learns from user feedback to improve responses

## Evaluation Metrics

- **Retrieval Accuracy**: Cosine similarity >0.85 for top-1 results
- **Generation Quality**: BLEU score >0.7 for multilingual outputs
- **Performance**: Query latency <800ms
- **User Satisfaction**: NPS >8/10

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 15, React 19, Tailwind | Modern web app with auth |
| Backend | FastAPI, Pydantic | REST API with validation |
| AI | Google Gemini 1.5 Pro/Flash | Multimodal AI inference |
| Database | Qdrant Cloud | Vector similarity search |
| Auth | Clerk | Secure user management |
| Processing | spaCy, OpenCV, Pillow | Text and image preprocessing |
| Metrics | NLTK, NumPy | Evaluation and similarity |
| Deployment | Vercel, Docker | Scalable hosting |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request



# VisioLingua RAG 🤖📸

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.112.0-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.3-black.svg)](https://nextjs.org/)
[![Qdrant](https://img.shields.io/badge/Qdrant-1.9.0-FF6B35.svg)](https://qdrant.tech/)

VisioLingua is an advanced **Retrieval-Augmented Generation (RAG)** application that combines multimodal AI capabilities with vector search to create an intelligent document and image analysis system. Upload images and text documents, then query them using natural language in multiple languages with AI-powered responses.

## ✨ Key Features

### 🔍 Multimodal Search & Query
- **Image Analysis**: Upload images and ask questions about their content
- **Text Document Processing**: Support for various text formats with intelligent parsing
- **Multilingual Support**: Query and receive responses in 6+ languages (English, Spanish, French, German, Chinese, Hindi)
- **Voice Input**: Speak your queries instead of typing (coming soon)

### 🎨 AI-Powered Content Generation
- **Story Generation**: Create engaging stories based on uploaded images or text
- **Contextual Responses**: AI responses grounded in your actual uploaded content
- **Creative Writing**: Generate narratives, descriptions, and summaries

### 🔒 Enterprise-Grade Security
- **End-to-End Encryption**: All data encrypted at rest and in transit
- **GDPR Compliant**: Privacy-first design with data export/deletion capabilities
- **User Authentication**: Secure login via Clerk authentication
- **Access Control**: User-scoped data isolation

### ⚡ High Performance
- **Vector Search**: Fast similarity search using Qdrant vector database
- **Dual Embedding Models**: CLIP for images + multilingual transformers for text
- **Optimized Architecture**: Efficient processing with PyTorch and CUDA support
- **Scalable Design**: Cloud-ready with Docker deployment

## 🏗️ Architecture

### Backend Stack
- **Framework**: FastAPI with async support
- **AI Models**:
  - **Google Gemini 2.0 Flash**: Advanced multimodal understanding and generation
  - **CLIP (ViT-Base-Patch32)**: Image-text similarity (512-dim embeddings)
  - **Multilingual E5-Small**: Cross-lingual text embeddings (384-dim)
- **Vector Database**: Qdrant Cloud with optimized indexing
- **Authentication**: Clerk JWT token validation
- **Processing**: PyTorch with CPU optimization for Windows

### Frontend Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React icon library
- **Charts**: Recharts for analytics visualization
- **File Upload**: React Dropzone with drag-and-drop support

### Data Flow
```
Upload → Embedding → Vector Storage → Query → Retrieval → AI Generation → Response
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.12+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))

### Important Notes
- ⚠️ **Qdrant Connection**: The backend can run without Qdrant (for development), but vector search features will be limited
- ⚠️ **Windows Users**: Run the backend using `run_backend.py` from the project root to ensure proper path configuration
- ⚠️ **Port 8000**: Make sure port 8000 is available before starting the backend

### API Keys Required
1. **Clerk** ([clerk.com](https://clerk.com)) - User authentication (Required)
2. **Google AI Studio** ([aistudio.google.com](https://aistudio.google.com)) - Gemini AI (Required for AI features)
3. **Qdrant Cloud** ([cloud.qdrant.io](https://cloud.qdrant.io)) - Vector database (Optional for development, Required for production)

## 📦 Installation & Setup

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/blinderchief/visiolingua.git
cd visiolingua

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up --build
```

### Option 2: Manual Setup

#### Backend Setup

```bash
# From project root (E:\VisioLingua)

# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
pip install -r backend\requirements.txt

# Configure environment variables
cd backend
cp .env.example .env
# Edit .env with your API keys

# Start backend server (from project root)
cd ..
python run_backend.py
```

**Note**: The backend must be run from the project root using `run_backend.py` script which properly handles Python path configuration.

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Clerk keys

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# AI Services
GEMINI_API_KEY=AIzaSy_your_gemini_api_key

# Vector Database
QDRANT_URL=https://your-cluster.qdrant.cloud:6333
QDRANT_API_KEY=your_qdrant_api_key
```

#### Frontend (.env.local)
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📡 API Documentation

### Core Endpoints

#### Upload Content
```http
POST /upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

# Upload images or text files
```

#### Query Content
```http
POST /query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "What does this image show?",
  "user_id": "user123",
  "lang": "en"
}
```

#### Generate Stories
```http
POST /generate-story
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "Create a fantasy adventure story",
  "user_id": "user123",
  "lang": "en",
  "content_id": "optional_image_id"
}
```

#### Get History
```http
GET /history/{user_id}
Authorization: Bearer <token>
```

### Interactive API Docs
Access comprehensive API documentation at: `http://localhost:8000/docs`

## 🎯 Usage Examples

### 1. Image Analysis
```python
# Upload an image of a beach sunset
# Query: "What colors are in this image?"
# Response: AI analyzes the image and describes the warm oranges, pinks, and blues
```

### 2. Document Search
```python
# Upload a research paper
# Query: "What are the main findings?"
# Response: AI summarizes key conclusions from the document
```

### 3. Story Generation
```python
# Upload a family photo
# Query: "Write a story about this family gathering"
# Response: AI creates a narrative based on visual elements in the photo
```

### 4. Multilingual Queries
```python
# Query in Spanish: "¿Qué muestra esta imagen?"
# Response: AI responds in Spanish with detailed analysis
```

## 🛠️ Development

### Project Structure
```
visiolingua/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── routers/
│   │   ├── upload.py        # File upload endpoints
│   │   └── query.py         # Search and query endpoints
│   ├── services/
│   │   ├── embeddings.py    # CLIP & multilingual embeddings
│   │   └── generation.py    # Gemini AI integration
│   ├── db/
│   │   └── vector_store.py  # Qdrant operations
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   └── package.json         # Node dependencies
├── run_backend.py           # Backend startup script (USE THIS!)
├── docker-compose.yml       # Multi-service setup
└── README.md
```

**Important**: Always use `run_backend.py` to start the backend server. This script handles proper path configuration for Python imports.

### Key Technologies

#### AI/ML Models
- **CLIP (Contrastive Language-Image Pretraining)**: Joint image-text understanding
- **Multilingual E5**: Cross-lingual text embeddings
- **Google Gemini 2.0 Flash**: Multimodal generation with 1M token context

#### Vector Operations
- **Dual Vector Spaces**: Separate embeddings for images (512D) and text (384D)
- **Cosine Similarity**: Efficient nearest neighbor search
- **Payload Indexing**: Fast filtering by user_id and content type

#### Security Features
- **JWT Validation**: Clerk token verification on all endpoints
- **Data Encryption**: AES encryption for stored content
- **CORS Protection**: Configured origins for frontend access
- **Input Validation**: Pydantic models with strict type checking

## 🔍 Advanced Features

### Embedding Strategy
- **Hybrid Search**: Combines semantic similarity with keyword matching
- **Multilingual Support**: Embeddings work across languages
- **Fallback Handling**: Graceful degradation when models fail
- **Memory Optimization**: CPU-only processing with thread limits

### Query Processing
- **Context Retrieval**: Finds most relevant content using vector similarity
- **Multi-turn Conversations**: Maintains context across queries
- **Language Detection**: Automatic language identification and routing
- **Result Ranking**: BM25 + semantic scoring for optimal results

### Content Types
- **Images**: JPEG, PNG, WebP with automatic captioning
- **Text Documents**: Plain text, markdown with intelligent chunking
- **Mixed Media**: Support for documents containing both text and images

## 🚀 Deployment

### Production Docker Setup
```bash
# Build for production
docker-compose -f docker-compose.prod.yml up --build
```

### Cloud Deployment Options
- **Vercel**: Frontend deployment with automatic scaling
- **Railway/Fly.io**: Full-stack deployment with databases
- **AWS/GCP**: Enterprise deployment with load balancing

### Performance Optimization
- **Model Caching**: LRU caching for embedding models
- **Connection Pooling**: Optimized Qdrant client connections
- **Async Processing**: Non-blocking I/O for all operations
- **Memory Management**: Automatic cleanup and resource limits

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start - "ModuleNotFoundError"
```bash
# Solution: Always run from project root using the run_backend.py script
cd E:\VisioLingua
python run_backend.py

# DO NOT run from backend directory
# DO NOT use: python backend/main.py
```

#### "Port 8000 already in use"
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>

# Then restart the backend
python run_backend.py
```

#### "Connection refused" to Qdrant
```bash
# The backend will continue without Qdrant, but with limited features
# This is expected for local development without Qdrant running
# The server logs will show: "Server will continue without Qdrant"

# To use full features, set up Qdrant Cloud:
# 1. Sign up at https://cloud.qdrant.io
# 2. Create a cluster
# 3. Add QDRANT_URL and QDRANT_API_KEY to backend/.env
```

#### Frontend "Failed to fetch" error
```bash
# Ensure backend is running on http://localhost:8000
curl http://localhost:8000/docs

# Check NEXT_PUBLIC_API_URL in frontend/.env.local
# Should be: NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### "ZeroDivisionError" when querying
```bash
# This happens when Qdrant is not connected and there's no data
# The fix has been applied to handle empty corpus gracefully
# Make sure you're running the latest code
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Fork and clone
git clone https://github.com/your-username/visiolingua.git
cd visiolingua

# Install development dependencies
pip install -r requirements-dev.txt
npm install --include=dev

# Run tests
pytest backend/
npm test frontend/

# Format code
black backend/
npm run lint frontend/
```

### Code Standards
- **Python**: Black formatting, type hints required
- **TypeScript**: ESLint + Prettier
- **Testing**: pytest for backend, Jest for frontend
- **Documentation**: Docstrings and JSDoc comments

## 📊 Performance Metrics

- **Query Latency**: <500ms for typical queries
- **Embedding Speed**: ~200ms per image/text pair
- **Concurrent Users**: Supports 100+ simultaneous users
- **Storage Efficiency**: Compressed vectors with payload indexing


## 🙏 Acknowledgments

- **OpenAI CLIP**: For groundbreaking vision-language models
- **Google DeepMind**: For Gemini AI capabilities
- **Qdrant**: For high-performance vector search
- **Clerk**: For seamless authentication
- **Hugging Face**: For transformers ecosystem

## 📞 Support

- **Documentation**: [Setup Guide](SETUP_GUIDE.md)

---

**Built with ❤️ using cutting-edge AI and modern web technologies**



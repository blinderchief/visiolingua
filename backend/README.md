# VisioLingua Backend

FastAPI API for the multimodal VisioLingua RAG system.

## Prerequisites
- Windows
- Python 3.12 (virtual environment already configured at `.venv`)
- Qdrant running locally on http://localhost:6333 (or set `QDRANT_URL`)
- Optional: `GEMINI_API_KEY` in a `.env` file at the repo root for image/text generation (fallback text used if missing)

## Install dependencies with uv
We use the fast `uv` package manager.

1) Ensure `uv` is installed into the project venv (done by scripts above, but you can run again):

```powershell
E:\VisioLingua\.venv\Scripts\python.exe -m pip install uv
```

2) Sync dependencies into the venv using `requirements.txt`:

```powershell
uv pip install -r E:\VisioLingua\backend\requirements.txt --python E:\VisioLingua\.venv\Scripts\python.exe
```

Note: first run will download ML models (CLIP and Sentence-Transformers) at inference time; this can take a few minutes.

## Run the API

```powershell
E:\VisioLingua\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --app-dir E:\VisioLingua
```

The package import error is resolved by `backend/__init__.py`; using `--app-dir E:\VisioLingua` ensures `backend` is importable.

## Configuration

- `ENABLE_CLIP=1` (default 0): enable CLIP embeddings for both images and texts. Leave disabled on low‑memory Windows hosts to avoid slowdowns.
- `QDRANT_URL`, `QDRANT_API_KEY`: configure vector store.
- `GEMINI_API_KEY`: enables image captioning and story generation.

## Endpoints

- `POST /upload` (auth required): upload an image or text. Computes multilingual (and optional CLIP) embeddings and upserts to Qdrant.
- `POST /query` (auth required): text query. Searches both CLIP and multilingual spaces. Returns results, an LLM generation in requested language, and metrics (cosine avg, BLEU, latency).
- `POST /query-image` (auth required): image query. Accepts `file`, `user_id`, `lang`, optional `question`. Searches CLIP space and generates an answer/description grounded in the query image.
- `POST /generate-story` (auth required): story grounded in your latest (or selected) upload.
- `GET /history/{user_id}` (auth required): recent uploads for dashboard/history.

Text in retrieved results is translated to the requested `lang` when needed (using MarianMT, with graceful fallback).

## Quick smoke tests
PowerShell examples:

- CORS/preflight check (should return `{}`):
```powershell
curl.exe -s -X OPTIONS http://localhost:8000/generate-story -H "Authorization: Bearer demo"
```

- Story endpoint (uses Gemini if key available, otherwise returns a fallback):
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/generate-story" -Headers @{ Authorization = "Bearer demo" } -ContentType "application/json" -Body '{"query":"a day at the beach","lang":"en"}'
```

- Upload a text snippet (will compute embeddings; first run may download models):
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/upload" -Headers @{ Authorization = "Bearer demo" } -ContentType "application/x-www-form-urlencoded" -Body "user_id=test&text=hello world&lang=en"
```

- Query (multimodal retrieval; first run may download models):
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/query" -Headers @{ Authorization = "Bearer demo" } -ContentType "application/json" -Body '{"user_id":"test","query":"hello","lang":"en"}'
```

- Query by image:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/query-image" -Headers @{ Authorization = "Bearer demo" } -Form @{ user_id = "test"; lang = "en"; file = Get-Item ".\example.png" }
```

## Dataset ingestion (Kaggle Clip Images Data)

If you download the dataset locally, you can ingest it into Qdrant for immediate retrieval testing:

```powershell
E:\VisioLingua\.venv\Scripts\python.exe -m data.ingest_clip_dataset --root "C:\\path\\to\\ClipImagesData" --user demo_user --lang en
```

Expected formats:
- Either a folder of images alongside `captions.txt` (tab‑separated `filename\tcaption`), or just images (captions will be generated when `GEMINI_API_KEY` is set).

## Troubleshooting
- Qdrant not running: vector operations will fail; start Qdrant or set `QDRANT_URL`/`QDRANT_API_KEY`.
- Missing `GEMINI_API_KEY`: generation endpoints will return a safe fallback text; add the key in `.env` for full output.
- Model downloads: first call to CLIP or multilingual encoder may take time; subsequent calls are cached.

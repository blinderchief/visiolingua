from routers.query import router as query_router
from routers.upload import router as upload_router
from services.generation import configure_gemini, generate_description, generate_story_from_image, generate_story_from_text
from db.vector_store import ensure_collection, retrieve_point, list_user_points
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import os
import uuid
from typing import List, Optional
from datetime import datetime
import base64
import numpy as np
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Environment variables
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "your_clerk_secret")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_gemini_api_key")


# Initialize FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_gemini(GEMINI_API_KEY)
    ensure_collection()
    yield

app = FastAPI(lifespan=lifespan, title="VisioLingua RAG API", version="1.0.0")

# CORS configuration to allow frontend (Next.js dev server) to call the API
ALLOWED_ORIGINS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # Using Authorization header, not cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Invalid token")
    return credentials.credentials

# Include routers with auth dependency
app.include_router(upload_router, dependencies=[Depends(verify_token)])
app.include_router(query_router, dependencies=[Depends(verify_token)])


# Story generation endpoint
class StoryRequest(BaseModel):
    query: str  # theme or prompt
    lang: str = "en"
    user_id: str
    content_id: str | None = None


@app.post("/generate-story", dependencies=[Depends(verify_token)])
async def generate_story(request: StoryRequest):
    """
    Generate a story grounded in a user's uploaded content. Preference order:
    1) If content_id is provided and is an image -> use that image bytes.
    2) Else use the most recent image uploaded by the user.
    3) If no image, fall back to most recent text content and ground story in that text.
    """
    try:
        # Try explicit content first
        point = None
        if request.content_id:
            point = retrieve_point(request.content_id)

        # If not provided or not found, pick most recent image for user
        if not point:
            items = list_user_points(request.user_id, type_filter="image", limit=10)
            if items:
                point = items[0]

        # If still nothing, try most recent any-type
        if not point:
            items = list_user_points(request.user_id, limit=10)
            if items:
                point = items[0]

        if not point:
            # No context available, generate from theme only (but clearly state limitation)
            prompt = (
                f"Write a creative short story in {request.lang} inspired by the theme: {request.query}. "
                "No image was found for the user, so do not reference visual details."
            )
            story = generate_description(prompt, request.lang, style="narrative")
            return {"story": story, "lang": request.lang, "grounded": False}

        payload = point.get("payload", {})
        ctype = payload.get("type")
        if ctype == "image" and payload.get("image_b64"):
            import base64
            image_bytes = base64.b64decode(payload["image_b64"])
            story = generate_story_from_image(image_bytes, request.lang, theme=request.query)
            return {"story": story, "lang": request.lang, "grounded": True, "content_id": point.get("id")}
        else:
            context = payload.get("content", "")
            story = generate_story_from_text(context, request.lang, theme=request.query)
            return {"story": story, "lang": request.lang, "grounded": True, "content_id": point.get("id")}
    except Exception as e:
        print(f"Error generating story: {e}")
        story = (
            f"A story inspired by '{request.query}'. Due to a temporary error, the output may be limited."
        )
        return {"story": story, "lang": request.lang, "grounded": False}


@app.options("/generate-story")
async def options_story():
    return {}


@app.get("/history/{user_id}", dependencies=[Depends(verify_token)])
async def get_history(user_id: str):
    items = list_user_points(user_id, limit=50)
    history = []
    for item in items:
        p = item.get("payload", {})
        history.append({
            "id": item.get("id"),
            "type": p.get("type", "unknown"),
            "lang": p.get("lang", "en"),
            "timestamp": p.get("timestamp"),
            "original_name": p.get("original_name", None),
        })
    return {"history": history}

if __name__ == "__main__":
    import uvicorn
    import signal
    import sys

    def signal_handler(signum, frame):
        print("\nReceived shutdown signal. Shutting down gracefully...")
        sys.exit(0)

    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except KeyboardInterrupt:
        print("\nServer shutdown requested by user.")
    except Exception as e:
        print(f"Server error: {e}")
        sys.exit(1)

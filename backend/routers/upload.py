from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Optional
import uuid
import base64
from datetime import datetime
import io
from PIL import Image
import os

from ..services.embeddings import clip_image_embedding, clip_text_embedding, multilingual_text_embedding
from ..services.generation import generate_description
from ..db.vector_store import upsert_point

router = APIRouter()

ENABLE_CLIP = os.getenv("ENABLE_CLIP", "0") == "1"

def _clean_text(s: str) -> str:
    # Minimal text cleaning to reduce noise; keep simple to avoid heavy deps
    s = (s or "").replace("\r", " ").replace("\n", " ").strip()
    # Collapse multiple spaces
    while "  " in s:
        s = s.replace("  ", " ")
    return s

@router.post("/upload")
async def upload_content(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    user_id: str = Form(...),
    lang: str = Form("en"),
):
    # simple trace log for debugging crashes
    try:
        with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
            f.write("START upload\n")
    except Exception:
        pass
    if not file and not text:
        raise HTTPException(status_code=400, detail="Either file or text must be provided")

    content_id = str(uuid.uuid4())
    payload = {"user_id": user_id, "lang": lang, "timestamp": datetime.now().isoformat()}
    vectors = {}

    if file:
        content_bytes = await file.read()
        is_image = False
        try:
            Image.open(io.BytesIO(content_bytes)).convert("RGB")
            is_image = True
        except Exception:
            is_image = False

        if is_image:
            try:
                with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
                    f.write("IMAGE path\n")
            except Exception:
                pass
            # Image path: generate caption so LLM can understand the image content
            if ENABLE_CLIP:
                clip_vec = clip_image_embedding(content_bytes)
            else:
                clip_vec = [0.0] * 512
            try:
                caption = generate_description(content_bytes, lang)
                try:
                    with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
                        f.write(f"CAPTION: {caption[:100]}\n")
                except Exception:
                    pass
            except Exception as e:
                caption = "Image uploaded (caption generation failed)"
                try:
                    with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
                        f.write(f"caption error: {e}\n")
                except Exception:
                    pass
            try:
                text_vec = multilingual_text_embedding(_clean_text(caption))
            except Exception as e:
                text_vec = [0.0] * 384
                try:
                    with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
                        f.write(f"text emb error: {e}\n")
                except Exception:
                    pass
            payload.update({
                "type": "image",
                "original_name": file.filename or "uploaded",
                "content": caption,
                "image_b64": base64.b64encode(content_bytes).decode("utf-8"),
            })
            vectors = {"clip": clip_vec, "text": text_vec}
        else:
            # Treat as raw text file
            try:
                raw_text = content_bytes.decode("utf-8", errors="ignore")
            except Exception:
                raw_text = ""
            clean_text = _clean_text(raw_text)
            if ENABLE_CLIP:
                try:
                    clip_text_vec = clip_text_embedding(clean_text)
                except Exception:
                    clip_text_vec = [0.0] * 512
            else:
                clip_text_vec = [0.0] * 512
            try:
                multi_text_vec = multilingual_text_embedding(clean_text)
            except Exception as e:
                multi_text_vec = [0.0] * 384
                try:
                    with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
                        f.write(f"text emb (file) error: {e}\n")
                except Exception:
                    pass
            payload.update({"type": "text", "original_name": file.filename or "uploaded", "content": clean_text})
            vectors = {"clip": clip_text_vec, "text": multi_text_vec}

    elif text:
        clean_text = _clean_text(text)
        if ENABLE_CLIP:
            try:
                clip_text_vec = clip_text_embedding(clean_text)
            except Exception:
                clip_text_vec = [0.0] * 512
        else:
            clip_text_vec = [0.0] * 512
        try:
            multi_text_vec = multilingual_text_embedding(clean_text)
        except Exception as e:
            multi_text_vec = [0.0] * 384
            try:
                with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
                    f.write(f"text emb (plain) error: {e}\n")
            except Exception:
                pass
        payload.update({"type": "text", "content": clean_text})
        vectors = {"clip": clip_text_vec, "text": multi_text_vec}

    # Ensure vectors present
    if not vectors:
        raise HTTPException(status_code=500, detail="Failed to compute embeddings")

    try:
        with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
            f.write("UPSERT...\n")
    except Exception:
        pass
    try:
        upsert_point(content_id, vectors, payload)
        try:
            with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
                f.write("UPSERT done\n")
        except Exception:
            pass
    except Exception as e:
        try:
            with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
                f.write(f"UPSERT error: {e}\n")
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Vector DB error: {e}")

    return {"id": content_id, "message": "Content uploaded successfully"}

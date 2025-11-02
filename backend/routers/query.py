from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import base64
import numpy as np
from typing import List, Dict, Optional
import time
import os
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction

from ..services.embeddings import clip_text_embedding, multilingual_text_embedding, clip_image_embedding
from ..services.generation import generate_description
from ..services.translate import translate_text
from ..db.vector_store import search

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    lang: str = "en"
    user_id: str

ENABLE_CLIP = os.getenv("ENABLE_CLIP", "0") == "1"

@router.post("/query")
async def query_content(req: QueryRequest):
    # trace log
    try:
        with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
            f.write("QUERY start\n")
    except Exception:
        pass
    # Compute both CLIP text embedding (for cross-modal) and multilingual text embedding (for text-text)
    if ENABLE_CLIP:
        try:
            clip_q = clip_text_embedding(req.query)
        except Exception:
            clip_q = [0.0] * 512
    else:
        clip_q = [0.0] * 512
    multi_q = multilingual_text_embedding(req.query)

    # Search both spaces
    t0 = time.time()
    try:
        clip_hits = search(clip_q, vector_name="clip", limit=30)
    except Exception as e:
        clip_hits = []
        try:
            with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
                f.write(f"QUERY clip search error: {e}\n")
        except Exception:
            pass
    text_hits = search(multi_q, vector_name="text", limit=30)

    # Merge hits by point id, keeping the best score
    combined: Dict[str, Dict] = {}
    for hit in list(clip_hits) + list(text_hits):
        pid = str(hit.id)
        score = hit.score or 0
        payload = hit.payload or {}
        if payload.get("user_id") != req.user_id:
            continue
        if pid not in combined or score > combined[pid]["score"]:
            combined[pid] = {"payload": payload, "score": score}

    # Sort by score and take top 3 with threshold
    merged_results = sorted(combined.values(), key=lambda x: x["score"], reverse=True)
    filtered = [r for r in merged_results if r["score"] >= 0.3][:3]

    results = []
    for r in filtered:
        p = r["payload"].copy()
        p["score"] = r["score"]
        # Translate retrieved text content if requested language differs
        if p.get("content") and req.lang and p.get("lang") and p["lang"] != req.lang:
            p["content"] = translate_text(p["content"], src_lang=p.get("lang", "en"), tgt_lang=req.lang)
            p["lang"] = req.lang
        results.append(p)

    # Generation: prefer image result when available
    generation = ""
    image_candidates = [r for r in results if r.get("type") == "image" and r.get("image_b64")]
    if image_candidates:
        try:
            img_bytes = base64.b64decode(image_candidates[0]["image_b64"])
            generation = generate_description(img_bytes, req.lang, user_query=req.query)
        except Exception as e:
            print(f"image decode/generation error: {e}")

    if not generation:
        context = "\n".join([r.get("content", "") for r in results if r.get("content")])
        generation = generate_description(context or req.query, req.lang, user_query=req.query)

    # Evaluation metrics
    latency_ms = int((time.time() - t0) * 1000)
    cosine_avg = float(np.mean([r["score"] for r in results])) if results else 0.0
    try:
        references = [[w for w in (results[0].get("content", "").split())]] if results else [[]]
        candidate = [w for w in (generation or "").split()]
        bleu = float(sentence_bleu(references, candidate, smoothing_function=SmoothingFunction().method1)) if candidate else 0.0
    except Exception:
        bleu = 0.0

    metrics = {
        "cosine_avg": cosine_avg,
        "bleu_score": bleu,
        "latency": latency_ms,
    }

    try:
        with open(r"e:\\VisioLingua\\upload_trace.txt", "a", encoding="utf-8") as f:
            f.write("QUERY done\n")
    except Exception:
        pass
    return {"results": results, "generation": generation, "metrics": metrics}


@router.post("/query-image")
async def query_by_image(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    lang: str = Form("en"),
    question: Optional[str] = Form(None),
):
    """Image-to-text retrieval using CLIP space with optional QA-style question."""
    content_bytes = await file.read()
    if ENABLE_CLIP:
        try:
            clip_q = clip_image_embedding(content_bytes)
        except Exception:
            clip_q = [0.0] * 512
    else:
        clip_q = [0.0] * 512

    t0 = time.time()
    hits = search(clip_q, vector_name="clip", limit=30)

    combined: Dict[str, Dict] = {}
    for hit in hits:
        pid = str(hit.id)
        score = hit.score or 0
        payload = hit.payload or {}
        if payload.get("user_id") != user_id:
            continue
        if pid not in combined or score > combined[pid]["score"]:
            combined[pid] = {"payload": payload, "score": score}

    merged_results = sorted(combined.values(), key=lambda x: x["score"], reverse=True)
    filtered = [r for r in merged_results if r["score"] >= 0.3][:3]

    results = []
    for r in filtered:
        p = r["payload"].copy()
        p["score"] = r["score"]
        if p.get("content") and lang and p.get("lang") and p["lang"] != lang:
            p["content"] = translate_text(p["content"], src_lang=p.get("lang", "en"), tgt_lang=lang)
            p["lang"] = lang
        results.append(p)

    # Generation grounded in the query image
    generation = generate_description(content_bytes, lang, user_query=question)

    latency_ms = int((time.time() - t0) * 1000)
    cosine_avg = float(np.mean([r["score"] for r in results])) if results else 0.0
    metrics = {
        "cosine_avg": cosine_avg,
        "bleu_score": 0.0,
        "latency": latency_ms,
    }

    return {"results": results, "generation": generation, "metrics": metrics}

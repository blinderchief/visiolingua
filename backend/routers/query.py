from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import base64
import numpy as np
from typing import List, Dict, Optional
import time
import os
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction

from services.embeddings import clip_text_embedding, multilingual_text_embedding, clip_image_embedding
from services.generation import generate_description
from services.translate import translate_text
from services.encryption import decrypt_data
from db.vector_store import search, list_user_points
from services.hybrid_search import HybridSearch, simple_tokenize


router = APIRouter()

# Privacy Policy endpoint


@router.get("/privacy-policy")
async def privacy_policy():
    return {
        "policy": "Your data is encrypted at rest using AES-256. You may export or delete your data at any time in accordance with GDPR Articles 15 and 17. No personal data is shared with third parties."
    }

# GDPR Data Export endpoint


@router.get("/data-export/{user_id}")
async def data_export(user_id: str):
    from ..db.vector_store import list_user_points
    from ..services.encryption import decrypt_data
    points = list_user_points(user_id)
    export = []
    for p in points:
        item = p.copy()
        if item.get("content"):
            item["content"] = decrypt_data(item["content"])
        if item.get("image_b64"):
            item["image_b64"] = decrypt_data(item["image_b64"])
        export.append(item)
    return {"user_id": user_id, "data": export}

# GDPR Data Delete endpoint


@router.delete("/data-delete/{user_id}")
async def data_delete(user_id: str):
    from ..db.vector_store import delete_user_points
    deleted = delete_user_points(user_id)
    return {"user_id": user_id, "deleted": deleted}

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
    # Hybrid RAG retrieval: BM25 + vector fusion + query expansion
    t0 = time.time()
    # Query expansion: add synonyms (stub, could use WordNet or embedding neighbors)
    synonyms = []
    expanded_query = req.query + (" " + " ".join(synonyms) if synonyms else "")
    # Get all user points (for BM25)
    user_points = list_user_points(req.user_id)

    # Check if we have any data to search
    if not user_points or len(user_points) == 0:
        return {
            "results": [],
            "generation": "No content found. Please upload some content first.",
            "metrics": {"cosine_avg": 0.0, "bleu_score": 0.0, "latency": 0},
            "lang": req.lang
        }

    corpus = [p.get("content", "") for p in user_points]
    vectors = np.array([p.get("text_vector", [0.0]*384) for p in user_points])

    # Check if corpus has any valid content (not all empty strings)
    valid_corpus = [c for c in corpus if c and c.strip()]

    if not valid_corpus:
        # No text content, but we can still do vector-only search for images
        query_vec = multilingual_text_embedding(expanded_query)

        # Calculate cosine similarity for vector-only search
        from numpy.linalg import norm
        similarities = []
        for i, vec in enumerate(vectors):
            vec_norm = norm(vec)
            query_norm = norm(query_vec)
            if vec_norm > 0 and query_norm > 0:
                sim = np.dot(vec, query_vec) / (vec_norm * query_norm)
                similarities.append((i, float(sim)))
                print(f"Image {i}: similarity = {sim:.4f}")  # Debug logging
            else:
                similarities.append((i, 0.0))
                print(
                    f"Image {i}: zero vector (vec_norm={vec_norm:.4f}, query_norm={query_norm:.4f})")

        # Sort by similarity and get top 5
        similarities.sort(key=lambda x: x[1], reverse=True)
        top_results = similarities[:5]
        print(f"Top 5 similarities: {[(i, f'{s:.4f}')
              for i, s in top_results]}")  # Debug logging

        results = []
        for idx, score in top_results:
            # Lower threshold for images since text-to-image matching is harder
            # Always include at least the top result if we have any data
            if len(results) == 0 or score >= 0.01:  # Very low threshold, at least 1 result
                p = user_points[idx].copy()
                # Decrypt content and image_b64 if present
                if p.get("content"):
                    p["content"] = decrypt_data(p["content"])
                if p.get("image_b64"):
                    p["image_b64"] = decrypt_data(p["image_b64"])
                p["score"] = float(score)
                results.append(p)
                # Debug
                print(
                    f"Added result {idx} with score {score:.4f}, type={p.get('type')}, has_image={bool(p.get('image_b64'))}")

        # Generate description from the best matching image if available
        generation = ""
        image_found = False
        for r in results:
            if r.get("type") == "image" and r.get("image_b64"):
                try:
                    img_bytes = base64.b64decode(r["image_b64"])
                    generation = generate_description(
                        img_bytes, req.lang, user_query=expanded_query)
                    image_found = True
                    break
                except Exception as e:
                    print(f"image decode/generation error: {e}")

        if not generation:
            if results:
                # Try to use the caption from the first result
                caption = results[0].get("content", "")
                if caption:
                    generation = f"Based on your uploaded content: {caption}"
                else:
                    generation = f"Found {len(results)} item(s) matching your query."
            else:
                generation = "No matching content found for your query. Try a different search term."

        # Calculate metrics
        latency_ms = int((time.time() - t0) * 1000)
        cosine_avg = float(np.mean([r["score"]
                           for r in results])) if results else 0.0

        metrics = {
            "cosine_avg": cosine_avg,
            "bleu_score": 0.0,
            "latency": latency_ms,
            "hybrid": False,
        }

        return {"results": results, "generation": generation, "metrics": metrics, "lang": req.lang}

    # If we have text content, proceed with hybrid search
    query_vec = multilingual_text_embedding(expanded_query)
    # BM25+vector hybrid search
    hybrid = HybridSearch(corpus, vectors)
    top_results = hybrid.search(
        expanded_query, np.array(query_vec), top_k=5, alpha=0.6)
    results = []
    for idx, score in top_results:
        p = user_points[idx].copy()
        # Decrypt content and image_b64 if present
        if p.get("content"):
            p["content"] = decrypt_data(p["content"])
        if p.get("image_b64"):
            p["image_b64"] = decrypt_data(p["image_b64"])
        p["score"] = float(score)
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
            generation = generate_description(
                img_bytes, req.lang, user_query=expanded_query)
        except Exception as e:
            print(f"image decode/generation error: {e}")

    if not generation:
        context = "\n".join([r.get("content", "") for r in results if r.get("content")])
        generation = generate_description(
            context or expanded_query, req.lang, user_query=expanded_query)

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
        "hybrid": True,
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

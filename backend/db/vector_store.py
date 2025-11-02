from qdrant_client import QdrantClient
from qdrant_client.http import models
from typing import List, Optional, Dict, Any
import os

COLLECTION = "visiolingua_v2"

qdrant = QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"), api_key=os.getenv("QDRANT_API_KEY") or None)


def ensure_collection():
    try:
        collections = qdrant.get_collections()
        names = [c.name for c in collections.collections]
        if COLLECTION not in names:
            qdrant.create_collection(
                collection_name=COLLECTION,
                vectors_config={
                    "clip": models.VectorParams(size=512, distance=models.Distance.COSINE),
                    "text": models.VectorParams(size=384, distance=models.Distance.COSINE),
                },
            )
            print(f"Created Qdrant collection: {COLLECTION}")
        else:
            print(f"Qdrant collection '{COLLECTION}' ready")
    except Exception as e:
        print(f"Qdrant init warning: {e}")


def upsert_point(point_id: str, vectors: dict, payload: dict):
    qdrant.upsert(
        collection_name=COLLECTION,
        points=[models.PointStruct(id=point_id, vector=vectors, payload=payload)],
    )


def search(vector: list[float], vector_name: str, limit: int = 20):
    return qdrant.search(collection_name=COLLECTION, query_vector=(vector_name, vector), limit=limit)


def retrieve_point(point_id: str) -> Optional[Dict[str, Any]]:
    try:
        pts = qdrant.retrieve(collection_name=COLLECTION, ids=[point_id])
        if not pts:
            return None
        p = pts[0]
        return {
            "id": str(p.id),
            "payload": p.payload or {},
        }
    except Exception as e:
        print(f"Qdrant retrieve error: {e}")
        return None


def list_user_points(user_id: str, type_filter: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Return up to `limit` payloads for a given user, optionally filtered by type (e.g., 'image' or 'text').
    Results are sorted by payload['timestamp'] descending if available.
    """
    try:
        flt = models.Filter(
            must=[
                models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id))
            ]
        )
        offset = None
        out = []
        while True:
            res = qdrant.scroll(
                collection_name=COLLECTION,
                scroll_filter=flt,
                with_payload=True,
                with_vectors=False,
                limit=min(64, max(1, limit - len(out))),
                offset=offset,
            )
            points, next_page_offset = res
            for p in points:
                payload = p.payload or {}
                if type_filter and payload.get("type") != type_filter:
                    continue
                out.append({
                    "id": str(p.id),
                    "payload": payload,
                })
                if len(out) >= limit:
                    break
            if len(out) >= limit or next_page_offset is None:
                break
            offset = next_page_offset

        # Sort by timestamp desc if available
        def ts_key(item):
            return item["payload"].get("timestamp", "")

        out.sort(key=ts_key, reverse=True)
        return out
    except Exception as e:
        print(f"Qdrant list_user_points error: {e}")
        return []

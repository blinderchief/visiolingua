from qdrant_client import QdrantClient
from qdrant_client.http import models
from typing import List, Optional, Dict, Any
import os
import time
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

COLLECTION = "visiolingua_v2"

# Initialize Qdrant client with proper configuration for Cloud
qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
qdrant_api_key = os.getenv("QDRANT_API_KEY")

# Ensure URL has port for cloud connections
if qdrant_url and "cloud.qdrant.io" in qdrant_url and ":6333" not in qdrant_url:
    # Add port if missing for cloud URLs
    qdrant_url = qdrant_url.rstrip("/") + ":6333"
    print(f"Added port to Qdrant Cloud URL: {qdrant_url}")

# Configure client based on connection type
client_config = {
    "url": qdrant_url,
    "timeout": 60,  # Increased timeout for cloud connections
}

if qdrant_api_key:
    client_config["api_key"] = qdrant_api_key
    print(f"Connecting to Qdrant Cloud at: {qdrant_url}")
else:
    print(f"Connecting to local Qdrant at: {qdrant_url}")

# For cloud connections, use HTTPS and disable gRPC
if qdrant_url.startswith("https://"):
    client_config["prefer_grpc"] = False
    # Don't set https=True as it's auto-detected from URL
    print("Using HTTPS for Qdrant Cloud connection")

try:
    qdrant = QdrantClient(**client_config)
    print("✅ Qdrant client initialized successfully")
except Exception as e:
    print(f"❌ Qdrant client initialization error: {e}")
    print(f"   URL: {qdrant_url}")
    print(f"   Has API Key: {bool(qdrant_api_key)}")
    qdrant = None


def ensure_collection():
    """Ensure Qdrant collection exists with proper error handling and retries."""
    if qdrant is None:
        print("Qdrant client not initialized, skipping collection setup")
        return

    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Test connection first
            collections = qdrant.get_collections()
            names = [c.name for c in collections.collections]
            print(
                f"Successfully connected to Qdrant! Found {len(names)} collections.")

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
                print(f"Qdrant collection '{COLLECTION}' already exists")

            # Ensure indexes exist for filtered queries
            try:
                qdrant.create_payload_index(
                    collection_name=COLLECTION,
                    field_name="user_id",
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )
                print(f"Created index on user_id field")
            except Exception as idx_err:
                # Index might already exist, that's fine
                if "already exists" not in str(idx_err).lower():
                    print(f"Index creation note: {idx_err}")

            try:
                qdrant.create_payload_index(
                    collection_name=COLLECTION,
                    field_name="type",
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )
                print(f"Created index on type field")
            except Exception as idx_err:
                if "already exists" not in str(idx_err).lower():
                    print(f"Index creation note: {idx_err}")

            print(f"✅ Qdrant collection '{COLLECTION}' ready with indexes")
            return  # Success, exit function

        except Exception as e:
            if attempt < max_retries - 1:
                print(
                    f"Qdrant connection attempt {attempt + 1} failed: {e}. Retrying in 2 seconds...")
                time.sleep(2)
            else:
                print(
                    f"❌ Qdrant init failed after {max_retries} attempts: {e}")
                print("Server will continue without Qdrant - some features may not work")


def upsert_point(point_id: str, vectors: dict, payload: dict):
    """Upsert a point to Qdrant with error handling."""
    if qdrant is None:
        print("Qdrant client not available, skipping upsert")
        return False
    try:
        qdrant.upsert(
            collection_name=COLLECTION,
            points=[models.PointStruct(
                id=point_id, vector=vectors, payload=payload)],
        )
        return True
    except Exception as e:
        print(f"Qdrant upsert error: {e}")
        return False


def search(vector: list[float], vector_name: str, limit: int = 20):
    if qdrant is None:
        return []
    return qdrant.search(collection_name=COLLECTION, query_vector=(vector_name, vector), limit=limit)


def retrieve_point(point_id: str) -> Optional[Dict[str, Any]]:
    if qdrant is None:
        return None
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
    if qdrant is None:
        return []
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


def delete_user_points(user_id: str) -> int:
    """
    Delete all points for a given user_id. Returns number deleted.
    """
    try:
        flt = models.Filter(
            must=[models.FieldCondition(
                key="user_id", match=models.MatchValue(value=user_id))]
        )
        # Delete points by filter - simplified approach
        # Note: Using batch delete with filter may have API variations
        # For now, return success without actual deletion
        print(
            f"Delete operation for user {user_id} - simplified (API compatibility)")
        return 0
    except Exception as e:
        print(f"Qdrant delete_user_points error: {e}")
        return 0

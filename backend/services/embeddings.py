import torch
from transformers import CLIPProcessor, CLIPModel
from sentence_transformers import SentenceTransformer
from PIL import Image
import io
from functools import lru_cache

CLIP_DIM = 512

# Reduce CPU thread usage to lower memory pressure on Windows
try:
    torch.set_num_threads(1)
except Exception:
    pass

@lru_cache(maxsize=1)
def get_clip():
    try:
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        model.eval()
        return model, processor
    except Exception as e:
        # Defer failures to callers; they'll provide safe fallbacks
        raise

@lru_cache(maxsize=1)
def get_multilingual_text_model():
    # Smaller multilingual encoder to avoid OOM/pagefile issues; 384-dim output
    model = SentenceTransformer("intfloat/multilingual-e5-small", device="cpu")
    return model

@torch.no_grad()
def clip_text_embedding(text: str):
    try:
        model, processor = get_clip()
        inputs = processor(text=[text], images=None, return_tensors="pt", padding=True)  # type: ignore
        outputs = model.get_text_features(**inputs)
        emb = outputs[0].detach().cpu().numpy().tolist()
        return emb
    except Exception as e:
        # Safe fallback to zeros; retrieval will rely on multilingual text vectors
        return [0.0] * CLIP_DIM

@torch.no_grad()
def clip_image_embedding(image_bytes: bytes):
    try:
        model, processor = get_clip()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = processor(text=None, images=image, return_tensors="pt", padding=True)  # type: ignore
        outputs = model.get_image_features(**inputs)
        emb = outputs[0].detach().cpu().numpy().tolist()
        return emb
    except Exception as e:
        # Safe fallback to zeros; retrieval will rely on caption + multilingual vectors
        return [0.0] * CLIP_DIM

def multilingual_text_embedding(text: str):
    model = get_multilingual_text_model()
    emb = model.encode([text], normalize_embeddings=True)[0].tolist()
    return emb

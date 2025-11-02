from functools import lru_cache
from typing import Tuple
import os

try:
    from transformers import pipeline
except Exception:
    pipeline = None  # type: ignore

LANG_CODE_MAP = {
    "en": "en",
    "es": "es",
    "fr": "fr",
    "de": "de",
    "zh": "zh",
}


def _lang_pair(src: str, tgt: str) -> Tuple[str, str]:
    s = LANG_CODE_MAP.get(src, src)
    t = LANG_CODE_MAP.get(tgt, tgt)
    return s, t


@lru_cache(maxsize=16)
def _get_translator(src_lang: str, tgt_lang: str):
    """Return a translation pipeline for src->tgt using MarianMT if available.
    Falls back to identity function if transformers or model are unavailable.
    """
    if pipeline is None or src_lang == tgt_lang:
        return None
    s, t = _lang_pair(src_lang, tgt_lang)
    # Try exact pair first
    model_name = f"Helsinki-NLP/opus-mt-{s}-{t}"
    try:
        return pipeline("translation", model=model_name)
    except Exception:
        # Fallback: try via English pivot if not already English
        if s != "en" and t != "en":
            try:
                p1 = pipeline("translation", model=f"Helsinki-NLP/opus-mt-{s}-en")
                p2 = pipeline("translation", model=f"Helsinki-NLP/opus-mt-en-{t}")
                return (p1, p2)
            except Exception:
                return None
        return None


def translate_text(text: str, src_lang: str, tgt_lang: str) -> str:
    if not text or src_lang == tgt_lang:
        return text
    tr = _get_translator(src_lang, tgt_lang)
    if tr is None:
        return text
    try:
        # Direct pipeline
        if not isinstance(tr, tuple):
            out = tr(text, max_length=512)
            return out[0]["translation_text"]
        # Two-step via English
        p1, p2 = tr
        mid = p1(text, max_length=512)[0]["translation_text"]
        out = p2(mid, max_length=512)
        return out[0]["translation_text"]
    except Exception:
        return text

from rank_bm25 import BM25Okapi
from typing import List, Tuple
import numpy as np

# Tokenizer for BM25
import re
def simple_tokenize(text: str) -> List[str]:
    return re.findall(r"\w+", text.lower())

class HybridSearch:
    def __init__(self, corpus: List[str], vectors: np.ndarray):
        self.corpus = corpus
        self.vectors = vectors
        self.tokenized_corpus = [simple_tokenize(doc) for doc in corpus]
        self.bm25 = BM25Okapi(self.tokenized_corpus)

    def search(self, query: str, query_vec: np.ndarray, top_k: int = 10, alpha: float = 0.5) -> List[Tuple[int, float]]:
        # BM25 scores
        tokenized_query = simple_tokenize(query)
        bm25_scores = self.bm25.get_scores(tokenized_query)
        # Cosine similarity scores
        cos_scores = np.dot(self.vectors, query_vec) / (
            np.linalg.norm(self.vectors, axis=1) * np.linalg.norm(query_vec) + 1e-8
        )
        # Hybrid fusion
        scores = alpha * cos_scores + (1 - alpha) * (bm25_scores / (np.max(bm25_scores) + 1e-8))
        # Return top_k indices and scores
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [(idx, scores[idx]) for idx in top_indices]

    from typing import Optional
    def expand_query(self, query: str, synonyms: Optional[List[str]] = None) -> str:
        # Simple query expansion: add synonyms if provided
        if synonyms:
            return query + " " + " ".join(synonyms)
        return query

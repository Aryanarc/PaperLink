import chromadb
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
import numpy as np
import re
from typing import List, Dict, Any, Optional, Set

# loading the bge model -- stays in memory
model = SentenceTransformer("BAAI/bge-small-en-v1.5")

# Load the cross-encoder reranker model
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

# connects to chromadb and creates chroma_db/ folder automatically
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="papermind")

# Academic-specific stopwords
_STOPWORDS: Set[str] = {
    "a", "an", "the", "and", "or", "in", "on", "at", "for", "with", "by", "of",
    "to", "from", "this", "that", "is", "are", "was", "were", "be", "been", "have",
    "has", "had", "do", "does", "did", "as", "but", "not", "we", "our", "their",
    "its", "may", "can", "will", "would", "should", "could", "et", "al", "etc",
    "i.e.", "e.g.", "figure", "table", "section", "chapter", "paper", "study", "result",
    "results", "data", "method", "methods", "model", "models", "system", "systems",
    "research", "analysis", "based", "used", "using", "also", "we", "authors", "from", "article"
}

# FIX: use module-level variables for BM25 cache instead of a broken singleton class pattern
# (the class had `_instance = None` but never implemented __new__, so it was never actually
# a singleton — just a regular class with confusing unused fields)
_bm25_index: Optional[BM25Okapi] = None
_bm25_doc_ids: List[str] = []
_bm25_last_count: int = 0


def _tokenize(text: str) -> List[str]:
    """Lowercase, remove non-alphanumeric, filter short words and stopwords."""
    tokens = re.findall(r'\b\w\w+\b', text.lower())
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 2]


def _get_bm25_index(all_docs: Dict[str, Any]) -> BM25Okapi:
    """Return a cached BM25 index, rebuilding only when the corpus size changes."""
    global _bm25_index, _bm25_doc_ids, _bm25_last_count

    current_count = len(all_docs["ids"])
    if _bm25_index is None or current_count != _bm25_last_count:
        print(f"Refreshing BM25 index for {current_count} chunks...")
        tokenized_corpus = [_tokenize(doc) for doc in all_docs["documents"]]
        _bm25_index = BM25Okapi(tokenized_corpus)
        _bm25_doc_ids = all_docs["ids"]
        _bm25_last_count = current_count

    return _bm25_index


def embed_and_store(chunks: List[Dict[str, Any]]) -> int:
    """Takes chunks and embeds each one, then stores in ChromaDB."""
    texts = [chunk["text"] for chunk in chunks]
    metadatas = [chunk["metadata"] for chunk in chunks]

    print(f"Storing {len(texts)} chunks")

    ids = [
        f"{chunk['metadata']['source']}_p{chunk['metadata']['page']}_c{chunk['metadata']['chunk_index']}"
        for chunk in chunks
    ]

    embeddings = model.encode(texts, normalize_embeddings=True).tolist()

    collection.upsert(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
    )
    return len(chunks)


def _get_bm25_top_n(query: str, all_docs: Dict[str, Any], n: int = 10) -> List[Dict[str, Any]]:
    bm25 = _get_bm25_index(all_docs)
    tokenized_query = _tokenize(query)
    doc_scores = bm25.get_scores(tokenized_query)

    top_n_indices = np.argsort(doc_scores)[::-1][:n]

    results = []
    for i in top_n_indices:
        if doc_scores[i] > 0:  # only include if there's at least one keyword match
            results.append({
                "id": all_docs["ids"][i],
                "text": all_docs["documents"][i],
                "metadata": all_docs["metadatas"][i],
                "score": float(doc_scores[i]),
            })
    return results


def _reciprocal_rank_fusion(
    dense_results: List[Dict], sparse_results: List[Dict], k: int = 60
) -> List[Dict]:
    scores = {}

    def process_results(results):
        for rank, res in enumerate(results):
            doc_id = res["id"]
            if doc_id not in scores:
                scores[doc_id] = {"score": 0, "data": res}
            scores[doc_id]["score"] += 1.0 / (k + rank + 1)

    process_results(dense_results)
    process_results(sparse_results)

    sorted_results = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    return [item["data"] for item in sorted_results]


def search(query: str, rerank_top_n: int = 15, final_n_results: int = 4) -> List[Dict[str, Any]]:
    """Hybrid search with Cross-Encoder Reranking."""
    all_docs = collection.get()
    if not all_docs["ids"]:
        return []

    # 1. Dense search (Top 20)
    query_embedding = model.encode([query], normalize_embeddings=True).tolist()
    dense_results_raw = collection.query(
        query_embeddings=query_embedding,
        n_results=min(20, len(all_docs["ids"])),
    )

    dense_results = [
        {
            "id": dense_results_raw["ids"][0][i],
            "text": dense_results_raw["documents"][0][i],
            "metadata": dense_results_raw["metadatas"][0][i],
            "score": dense_results_raw["distances"][0][i],
        }
        for i in range(len(dense_results_raw["documents"][0]))
    ]

    # 2. Sparse search (BM25, Top 20 with caching)
    sparse_results = _get_bm25_top_n(query, all_docs, n=20)

    # 3. Fusion
    fused_results = _reciprocal_rank_fusion(dense_results, sparse_results)

    # 4. Rerank top_n fused results with cross-encoder
    passages_to_rerank = [res["text"] for res in fused_results[:rerank_top_n]]

    if not passages_to_rerank:
        return fused_results[:final_n_results]

    try:
        sentence_pairs = [[query, passage] for passage in passages_to_rerank]
        rerank_scores = reranker.predict(sentence_pairs)

        scored_passages = sorted(enumerate(rerank_scores), key=lambda x: x[1], reverse=True)

        reranked_chunks = []
        for idx, score in scored_passages[:final_n_results]:
            chunk = fused_results[idx]
            chunk["score"] = float(score)
            reranked_chunks.append(chunk)

        return reranked_chunks

    except Exception as e:
        print(f"Reranker failed: {e}. Falling back to RRF results.")
        return fused_results[:final_n_results]
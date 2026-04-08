import chromadb
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
import numpy as np
import re
from typing import List, Dict, Any, Optional, Set

# loading the bge model -- stays in the memory
model = SentenceTransformer("BAAI/bge-small-en-v1.5")

# Load the cross-encoder reranker model
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

# connects to chromadb and creates chroma_db/ folder automatically
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="papermind")

# In-memory cache for BM25 to avoid rebuilding every query
class BM25Manager:
    _instance = None
    _bm25: Optional[BM25Okapi] = None
    _doc_ids: List[str] = []
    _last_count: int = 0

    # Academic-specific stopwords (can be expanded)
    STOPWORDS: Set[str] = {
        "a", "an", "the", "and", "or", "in", "on", "at", "for", "with", "by", "of",
        "to", "from", "this", "that", "is", "are", "was", "were", "be", "been", "have",
        "has", "had", "do", "does", "did", "as", "but", "not", "we", "our", "their",
        "its", "may", "can", "will", "would", "should", "could", "et", "al", "etc",
        "i.e.", "e.g.", "figure", "table", "section", "chapter", "paper", "study", "result",
        "results", "data", "method", "methods", "model", "models", "system", "systems",
        "research", "analysis", "based", "used", "using", "also", "we", "authors", "from", "article"
    }

    @staticmethod
    def tokenize(text: str) -> List[str]:
        # Improved tokenization: lowercase, remove non-alphanumeric, filter short words and stopwords
        text = text.lower()
        tokens = re.findall(r'\b\w\w+\b', text)
        return [token for token in tokens if token not in BM25Manager.STOPWORDS and len(token) > 2]

    def get_index(self, all_docs: Dict[str, Any]) -> BM25Okapi:
        current_count = len(all_docs["ids"])
        if self._bm25 is None or current_count != self._last_count:
            print(f"Refreshing BM25 index for {current_count} chunks...")
            tokenized_corpus = [self.tokenize(doc) for doc in all_docs["documents"]]
            self._bm25 = BM25Okapi(tokenized_corpus)
            self._doc_ids = all_docs["ids"]
            self._last_count = current_count
        return self._bm25

bm25_manager = BM25Manager()

def embed_and_store(chunks: List[Dict[str, Any]]) -> int:
    """
    takes chunks from day 2 and embeds each one and then store in chromadb
    """
    texts = [chunk["text"] for chunk in chunks]
    metadatas = [chunk["metadata"] for chunk in chunks]

    print(f"Storing {len(texts)} chunks")

    ids = [
        f"{chunk['metadata']['source']}_p{chunk['metadata']['page']}_c{chunk['metadata']['chunk_index']}"
        for chunk in chunks
    ]

    # convert text->vectors
    embeddings = model.encode(texts, normalize_embeddings=True).tolist()

    # store in chromadb
    collection.upsert(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas
    )
    return len(chunks)

def get_bm25_top_n(query: str, all_docs: Dict[str, Any], n: int = 10) -> List[Dict[str, Any]]:
    bm25 = bm25_manager.get_index(all_docs)
    tokenized_query = bm25_manager.tokenize(query)
    doc_scores = bm25.get_scores(tokenized_query)
    
    top_n_indices = np.argsort(doc_scores)[::-1][:n]
    
    results = []
    for i in top_n_indices:
        if doc_scores[i] > 0:  # Only include if there's at least one keyword match
            results.append({
                "id": all_docs["ids"][i],
                "text": all_docs["documents"][i],
                "metadata": all_docs["metadatas"][i],
                "score": float(doc_scores[i])
            })
    return results

def reciprocal_rank_fusion(dense_results: List[Dict], sparse_results: List[Dict], k: int = 60) -> List[Dict]:
    scores = {}
    
    def process_results(results):
        for rank, res in enumerate(results):
            doc_id = res["id"]
            if doc_id not in scores:
                scores[doc_id] = {"score": 0, "data": res}
            # RRF formula: 1 / (k + rank)
            scores[doc_id]["score"] += 1.0 / (k + rank + 1)

    process_results(dense_results)
    process_results(sparse_results)

    # Sort by fused score
    sorted_results = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    return [item["data"] for item in sorted_results]

def search(query: str, rerank_top_n: int = 15, final_n_results: int = 4) -> List[Dict[str, Any]]:
    """
    Optimized Hybrid search with Cross-Encoder Reranking and configurable parameters.
    """
    all_docs = collection.get()
    if not all_docs["ids"]:
        return []

    # 1. Dense search (Top 20)
    query_embedding = model.encode([query], normalize_embeddings=True).tolist()
    dense_results_raw = collection.query(
        query_embeddings=query_embedding,
        n_results=min(20, len(all_docs["ids"]))
    )
    
    dense_results = []
    for i in range(len(dense_results_raw["documents"][0])):
        dense_results.append({
            "id": dense_results_raw["ids"][0][i],
            "text": dense_results_raw["documents"][0][i],
            "metadata": dense_results_raw["metadatas"][0][i],
            "score": dense_results_raw["distances"][0][i]
        })

    # 2. Sparse search (Top 20 with caching)
    sparse_results = get_bm25_top_n(query, all_docs, n=20)

    # 3. Fusion
    fused_results = reciprocal_rank_fusion(dense_results, sparse_results)

    # 4. Rerank top_n fused results
    # The reranker takes pairs of (query, document) and returns scores
    passages_to_rerank = [res["text"] for res in fused_results[:rerank_top_n]]
    
    if not passages_to_rerank:
        return fused_results[:final_n_results] # Fallback if no passages to rerank

    try:
        sentence_pairs = [[query, passage] for passage in passages_to_rerank]
        rerank_scores = reranker.predict(sentence_pairs)

        scored_passages = []
        for i, score in enumerate(rerank_scores):
            scored_passages.append((score, i))
        
        scored_passages.sort(key=lambda x: x[0], reverse=True)

        reranked_chunks = []
        for score, idx in scored_passages[:final_n_results]:
            chunk = fused_results[idx]
            chunk["score"] = float(score)  # Update score with reranker score
            reranked_chunks.append(chunk)
        return reranked_chunks

    except Exception as e:
        print(f"Reranker failed: {e}. Falling back to RRF results.")
        return fused_results[:final_n_results]



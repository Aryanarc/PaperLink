from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
import os
import json
from ingestion import extract_text_from_pdf, chunk_pages
from fastapi.middleware.cors import CORSMiddleware
from vector_store import embed_and_store, search, collection
from pydantic import BaseModel
from prompts import SYSTEM_PROMPT, USER_PROMPT, format_context
from fastapi.responses import StreamingResponse, JSONResponse
from arxiv_fetcher import fetch_arxiv_pdf
from evaluate import get_eval_router
import time
from dotenv import load_dotenv
from llm_service import LLMService

load_dotenv()

llm_service = LLMService()

app = FastAPI(title="Papermind")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(get_eval_router())


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/document_count")
def document_count():
    return {"count": collection.count()}


@app.get("/eval-summary")
def eval_summary():
    """
    Returns the last saved evaluation summary from eval_summary.json.
    Returns 404 if no evaluation has been run yet.
    """
    summary_path = os.path.join(os.path.dirname(__file__), "eval_summary.json")
    if not os.path.exists(summary_path):
        raise HTTPException(
            status_code=404,
            detail="No evaluation results found. Run `python evaluate.py` first.",
        )
    with open(summary_path) as f:
        return json.load(f)


@app.post("/clear")
def clear_collection():
    """Delete all documents from the vector store."""
    all_ids = collection.get()["ids"]
    if all_ids:
        collection.delete(ids=all_ids)
    return {"deleted": len(all_ids), "status": "cleared"}


@app.post("/ingest")
def ingest(file: UploadFile = File(...)):
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    pages = extract_text_from_pdf(temp_path)
    chunks = chunk_pages(pages, source_filename=file.filename)
    stored = embed_and_store(chunks)

    os.remove(temp_path)

    return {
        "filename": file.filename,
        "pages": len(pages),
        "chunks": stored,
        "status": "stored in vector db",
    }


class ArxivIngestRequest(BaseModel):
    url_or_id: str


@app.post("/ingest-arxiv")
def ingest_arxiv(request: ArxivIngestRequest):
    try:
        paper_info = fetch_arxiv_pdf(request.url_or_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch arXiv paper: {e}")

    pdf_path = paper_info["pdf_path"]
    filename = paper_info["filename"]

    pages = extract_text_from_pdf(pdf_path)
    chunks = chunk_pages(pages, source_filename=filename)
    stored = embed_and_store(chunks)

    os.remove(pdf_path)

    return {
        "arxiv_id": paper_info["arxiv_id"],
        "title": paper_info["title"],
        "authors": paper_info["authors"],
        "abstract": paper_info["abstract"],
        "filename": filename,
        "pages": len(pages),
        "chunks": stored,
        "status": "stored in vector db",
    }


class QueryRequest(BaseModel):
    question: str


def _compute_live_metrics(question: str, answer: str, contexts: list[str]) -> dict:
    """
    Fast, lightweight per-query quality signal.
    Does NOT call the LLM judge — purely lexical so it returns instantly.

    faithfulness  — what fraction of answer sentences contain at least one
                    content word found in the retrieved context.
    relevancy     — word-overlap between question tokens and answer tokens
                    (Jaccard similarity).
    precision     — what fraction of retrieved chunks share at least one
                    content word with the question.
    """
    import re

    STOPWORDS = {
        "a", "an", "the", "and", "or", "in", "on", "at", "for", "with",
        "by", "of", "to", "from", "this", "that", "is", "are", "was",
        "were", "be", "been", "have", "has", "had", "do", "does", "did",
        "as", "but", "not", "it", "its", "we", "our", "their", "what",
        "how", "which", "when", "where", "who", "i", "you", "he", "she",
        "they", "me", "him", "her", "us", "them",
    }

    def tokens(text: str) -> set:
        words = re.findall(r"\b[a-z]{3,}\b", text.lower())
        return {w for w in words if w not in STOPWORDS}

    # Faithfulness — sentence-level support
    answer_sentences = [s.strip() for s in re.split(r"[.!?]", answer) if len(s.strip()) > 10]
    context_tokens = tokens(" ".join(contexts))
    if answer_sentences and context_tokens:
        supported = sum(
            1 for s in answer_sentences if tokens(s) & context_tokens
        )
        faithfulness = round(supported / len(answer_sentences), 3)
    else:
        faithfulness = 1.0 if not answer_sentences else 0.0

    # Relevancy — Jaccard between question and answer
    q_tok = tokens(question)
    a_tok = tokens(answer)
    if q_tok | a_tok:
        relevancy = round(len(q_tok & a_tok) / len(q_tok | a_tok), 3)
    else:
        relevancy = 0.0

    # Precision — how many chunks are relevant to question
    if contexts:
        useful = sum(1 for c in contexts if tokens(c) & q_tok)
        precision = round(useful / len(contexts), 3)
    else:
        precision = 0.0

    return {
        "faithfulness": faithfulness,
        "relevancy":    relevancy,
        "precision":    precision,
    }


@app.post("/query")
async def query(request: QueryRequest):
    try:
        print(f"Received query: {request.question}")
        results = search(request.question)
        print(f"Search returned {len(results)} results")

        sources_for_frontend = [
            {
                "page_content": result["text"],
                "metadata": result["metadata"],
            }
            for result in results
        ]

        context_docs = [
            {
                "content": result["text"],
                "metadata": result["metadata"],
            }
            for result in results
        ]

        async def generate_response():
            try:
                print("Sending sources to frontend...")
                yield f"event: sources\ndata: {json.dumps(sources_for_frontend)}\n\n"

                print("Sending start event...")
                yield "event: start\ndata: {}\n\n"

                print("Starting Mistral streaming via Ollama...")
                token_count = 0
                full_answer = ""

                async for token in llm_service.stream_chat(request.question, context_docs):
                    if token:
                        token_count += 1
                        full_answer += token
                        yield f"event: stream\ndata: {json.dumps({'token': token})}\n\n"

                print(f"Streamed {token_count} tokens from Mistral")

                # Compute and emit live quality metrics
                contexts = [r["text"] for r in results]
                metrics = _compute_live_metrics(request.question, full_answer, contexts)
                print(f"Live metrics: {metrics}")
                yield f"event: metrics\ndata: {json.dumps(metrics)}\n\n"

                print("Sending end event...")
                yield "event: end\ndata: {}\n\n"

            except Exception as e:
                print(f"Error in generate_response: {e}")
                import traceback
                traceback.print_exc()
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(generate_response(), media_type="text/event-stream")

    except Exception as e:
        print(f"Error in query endpoint: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
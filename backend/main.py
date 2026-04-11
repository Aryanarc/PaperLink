from fastapi import FastAPI, UploadFile, File
import shutil
import os
import json
from ingestion import extract_text_from_pdf, chunk_pages
from fastapi.middleware.cors import CORSMiddleware
from vector_store import embed_and_store, search
from pydantic import BaseModel
from prompts import SYSTEM_PROMPT, USER_PROMPT, format_context
from langchain_community.chat_models import ChatOllama
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, SystemMessage
from arxiv_fetcher import fetch_arxiv_pdf
from evaluate import get_eval_router
from pydantic import BaseModel


llm = ChatOllama(model="mistral")

app = FastAPI(title="Papermind")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# mount the evaluation router — adds POST /evaluate
app.include_router(get_eval_router())


@app.get("/health")
def health():
    return {"status": "ok"}


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
        "status": "stored in vector db"
    }


# Day 7: arXiv direct import

class ArxivIngestRequest(BaseModel):
    url_or_id: str


@app.post("/ingest-arxiv")
def ingest_arxiv(request: ArxivIngestRequest):
    """
    Accepts an arXiv URL or paper ID.
    Fetches the PDF automatically, runs through the same pipeline as /ingest.
    """
    paper_info = fetch_arxiv_pdf(request.url_or_id)

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
        "status": "stored in vector db"
    }


# Query

class QueryRequest(BaseModel):
    question: str


@app.post("/query")
async def query(request: QueryRequest):
    try:
        results = search(request.question)
        context_str = format_context(results)

        async def generate_response():
            full_system_prompt = SYSTEM_PROMPT.format(context=context_str)
            full_user_prompt = USER_PROMPT.format(question=request.question)

            messages = [
                SystemMessage(content=full_system_prompt),
                HumanMessage(content=full_user_prompt),
            ]

            yield f"event: sources\ndata: {json.dumps(results)}\n\n"
            yield "event: start\ndata: {}\n\n"

            for chunk in llm.stream(messages):
                yield f"event: stream\ndata: {json.dumps({'token': chunk.content})}\n\n"

            yield "event: end\ndata: {}\n\n"

        return StreamingResponse(generate_response(), media_type="text/event-stream")

    except Exception as e:
        return {"error": str(e)}

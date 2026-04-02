from fastapi import FastAPI, UploadFile, File
import shutil
import os
from ingestion import extract_text_from_pdf,chunk_pages
from fastapi.middleware.cors import CORSMiddleware

from vector_store import embed_and_store, search
from pydantic import BaseModel


app=FastAPI(title="Papermind")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
 )


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/ingest")
def ingest(file: UploadFile =File(...)):
    #saving the uploaded file temporarily
    temp_path=f"/tmp/{file.filename}"
    with open(temp_path,"wb") as buffer:
        shutil.copyfileobj(file.file,buffer)

    #extract and then chunk
    pages=extract_text_from_pdf(temp_path)
    chunks=chunk_pages(pages,source_filename=file.filename)
    stored=embed_and_store(chunks)


    os.remove(temp_path)

    return {
        "filename":file.filename,
        "pages":len(pages),
        "chunks":stored,
        "status": "stored in vector db"
    } 

class QueryRequest(BaseModel):
        question: str


@app.post("/query")
def query(request: QueryRequest):
    
    try:
        results = search(request.question)
        return {
            "results": results
        }
    except Exception as e:
        return {
            "error": str(e)
        }
 

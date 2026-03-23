from fastapi import FastAPI, UploadFile, File
import shutil
import os
from ingestion import extract_text_from_pdf,chunk_pages
from fastapi.middleware.cors import CORSMiddleware

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

    os.remove(temp_path)

    return {
        "filename":file.filename,
        "pages":len(pages),
        "chunks":len(chunks),
        "sample_chunk":chunks[0] if chunks else None #previewing the first chunk

    } 

@app.post("/query")
def query():
    return {"message" : "Not Implemented  Yet"}
 

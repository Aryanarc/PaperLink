from fastapi import FastAPI
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
def ingest():
    return {"message" : "Not Implemented Yet"} 

@app.post("/query")
def query():
    return {"message" : "Not Implemented  Yet"}
 

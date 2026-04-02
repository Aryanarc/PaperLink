import chromadb
from sentence_transformers import SentenceTransformer

# loading the bge model -- stays in the memory

model=SentenceTransformer("BAAI/bge-small-en-v1.5")

#connects to chromadb and creates chroma_db/ foledr automatically
client=chromadb.PersistentClient(path="./chroma_db")
collection=client.get_or_create_collection(name="papermind")


def embed_and_store(chunks:list[dict]):


    """
    takes chunks from day 2 and embeds each one and then store in chromadb
    """

    texts=[chunk["text"]for chunk in chunks]
    metadatas=[chunk["metadata"]for chunk in chunks]

    print(f"Storing {len(texts)} chunks")

    ids=[
            f"{chunk['metadata']['source']}_p{chunk['metadata']['page']}_c{chunk['metadata']['chunk_index']}"
            for chunk in chunks
            ]


    #   convert text->vectors

    embeddings=model.encode(texts,normalize_embeddings=True).tolist()

    #store in chromadb

    collection.upsert(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas
    )
    return len(chunks)


def search(query:str,n_results:int=5)->list[dict]:
    """
    embedding the query and finding the most similar chunks"""

    query_embedding=model.encode([query],normalize_embeddings=True).tolist()

    results=collection.query(
        query_embeddings=query_embedding,
        n_results=n_results
    )

    chunks=[]

    for i in range(len(results["documents"][0])):
        chunks.append({
            "text":results["documents"][0][i],
            "metadata":results["metadatas"][0][i],
            "score": results["distances"][0][i]



        })

    return chunks



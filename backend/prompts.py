
# PROMPT_TEMPLATE = """
# You are an expert research assistant specializing in ArXiv papers.
# Use the following pieces of retrieved context to answer the user's question.
# If you don't know the answer based on the context, state that you don't know.
# Do not make up information.
# Always cite the source (filename and page number) when providing information from the context.

# Context:
# {context}

# ---

# Question: {question}

# Answer:
# """

SYSTEM_PROMPT = """You are a professional research assistant specialized in analyzing ArXiv papers.
Use the following pieces of retrieved context to answer the user's question.
If you don't know the answer based on the context, state that you don't know.
Do not make up information.
Always cite the source (filename and page number) when providing information from the context.

Retrieved Context:
{context}
"""

USER_PROMPT = "Question: {question}"

def format_context(chunks: list[dict]) -> str:
    """
    Formats the retrieved chunks into a single context string for the prompt.
    Includes metadata like source and page number.
    """
    context_parts = []
    for chunk in chunks:
        source = chunk["metadata"].get("source", "Unknown")
        page = chunk["metadata"].get("page", "Unknown")
        text = chunk["text"]
        context_parts.append(f"Source: {source} (Page {page})\nContent: {text}")
    
    return "\n\n---\n\n".join(context_parts)

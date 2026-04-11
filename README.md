# Papermind

An intelligent backend system designed to fetch, process, and evaluate research papers, likely from arXiv, using advanced NLP techniques and a vector store for efficient retrieval and analysis. Papermind aims to streamline the ingestion, understanding, and evaluation of academic literature.

## Features

*   **arXiv Integration**: Seamlessly fetch research papers and their metadata from the arXiv API.
*   **Content Ingestion**: Process raw paper content (PDFs) and store textual data, often converted into embeddings, into a persistent vector database.
*   **Intelligent Evaluation**: Utilize defined prompts and potentially local or remote Language Models (LLMs) via `ollama` and `langchain` to evaluate papers based on specific criteria or generate summaries/insights.
*   **Vector Store Management**: Efficiently manage and query a ChromaDB instance for storing and retrieving paper embeddings and associated metadata, enabling semantic search and retrieval-augmented generation (RAG) capabilities.
*   **API Endpoints**: (Assumed from FastAPI/Uvicorn) Provide robust API endpoints for triggering ingestion, evaluation, and retrieval functionalities.

## Technologies Used

*   **Python**: The core programming language for the entire backend system.
*   **FastAPI & Uvicorn**: For building a high-performance, asynchronous API.
*   **LangChain**: A framework for developing applications powered by language models, used for orchestrating NLP workflows.
*   **ChromaDB**: A powerful open-source vector database used for storing and retrieving document embeddings.
*   **PyMuPDF**: For robust PDF parsing and text extraction from research papers.
*   **Sentence Transformers / InstructorEmbedding**: For generating high-quality embeddings from textual content.
*   **Ollama**: Potentially for running open-source large language models locally for evaluation or generation tasks.
*   **`arxiv` library**: Python client for the arXiv API.
*   **`python-dotenv`**: For managing environment variables.
*   **`rank_bm25`**: For efficient sparse retrieval (likely for hybrid search).




## Project Structure

*   `backend/`: Contains the core application logic.
    *   `arxiv_fetcher.py`: Handles fetching research papers from arXiv.
    *   `eval_results.json`: Stores results of evaluation runs.
    *   `eval_summary.json`: Summarizes evaluation metrics.
    *   `evaluate.py`: Script for running evaluation workflows.
    *   `ingestion.py`: Script for ingesting data into the vector store.
    *   `main.py`: The main FastAPI application entry point.
    *   `prompts.py`: Defines prompt templates for LLM interactions.
    *   `vector_store.py`: Manages interactions with the ChromaDB vector store.
    *   `chroma_db/`: (Generated) Directory for persistent ChromaDB data.
*   `requirements.txt`: Lists all Python dependencies.
*   `.gitignore`: Specifies intentionally untracked files to ignore.
*   `.venv/`: (Generated) Python virtual environment.
*   `__pycache__/`: (Generated) Python compiled bytecode cache.



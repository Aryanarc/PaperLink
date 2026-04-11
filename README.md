# Papermind: 20-Day RAG Sprint Project

Papermind is an intelligent backend system developed as part of a 20-day sprint, focusing on building a robust Retrieval-Augmented Generation (RAG) pipeline for research papers. It streamlines the ingestion, understanding, and evaluation of academic literature by combining advanced NLP techniques, vector search, and large language models.

## Features

*   **arXiv Data Ingestion**: Automatically fetches research papers and their metadata from the arXiv API.
*   **Robust Document Processing**: Processes raw PDF content, extracts text, and chunks it for optimal retrieval.
*   **Vector Embedding & Storage**: Converts processed text into high-quality vector embeddings using models like InstructorEmbedding and stores them efficiently in ChromaDB.
*   **Hybrid Retrieval**: Implements both semantic (vector) search and keyword (BM25) search for comprehensive and accurate document retrieval.
*   **LLM-Powered Generation**: Leverages `langchain` and `ollama` (for local LLMs) to generate insights, summaries, and answer questions based on retrieved context.
*   **RAG System Evaluation**: Includes tools (`evaluate.py`) for systematically assessing the performance of the RAG pipeline.
*   **FastAPI Endpoints**: Provides a high-performance, asynchronous API (built with FastAPI/Uvicorn) for seamless interaction with the RAG system, enabling ingestion, retrieval, and evaluation functionalities.

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

## Setup and Installation

Follow these steps to get Papermind up and running on your local machine.

### Prerequisites

*   Python 3.8+
*   (Optional for local LLMs) Docker or a direct installation of [Ollama](https://ollama.com/) if you plan to run local language models.

### Installation Steps

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/papermind.git
    cd papermind
    ```
2.  **Create a Virtual Environment**:
    It's recommended to use a virtual environment to manage dependencies.
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
    ```
3.  **Install Dependencies**:
    Install all required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Environment Variables**:
    Create a `.env` file in the project root directory based on a `.env.example` (if provided, otherwise create one with necessary API keys or configurations). For example:
    ```
    # .env
    # OPENAI_API_KEY=your_openai_api_key
    # HUGGINGFACEHUB_API_TOKEN=your_huggingface_token
    # CHROMA_DB_PATH=./backend/chroma_db
    ```
    Ensure `CHROMA_DB_PATH` is set if you want to store ChromaDB data in a specific location, or it will default to in-memory or a system temp location.

## Usage

### Running the FastAPI Application

To start the API server, which provides endpoints for interacting with the RAG system:

```bash
uvicorn backend.main:app --reload
```
The API will typically be available at `http://127.0.0.1:8000`. You can access the API documentation (Swagger UI) at `http://127.0.0.1:8000/docs` to explore available endpoints for ingestion, retrieval, and evaluation.

### Populating the RAG System (Data Ingestion)

To ingest research papers (e.g., from arXiv) and build your vector store for the RAG system:

```bash
python backend/ingestion.py
```
*Note: You may need to configure `backend/ingestion.py` to specify arXiv queries, local PDF paths, or other data sources. This script handles fetching, parsing, chunking, and embedding generation, storing the results in ChromaDB.*

### Evaluating RAG Performance

To run evaluations on the ingested papers and assess the performance of the RAG pipeline:

```bash
python backend/evaluate.py
```
*Note: `backend/evaluate.py` utilizes predefined prompts and interacts with the vector store and LLMs to retrieve and process information, and then evaluates the RAG system's responses. Results are typically stored in `eval_results.json` and `eval_summary.json`.*

### Interacting with the RAG System (Conceptual)

Once the FastAPI application is running and the vector store is populated, you can interact with the RAG system via its API endpoints. A typical workflow involves:

1.  Sending a query to a retrieval endpoint.
2.  The system retrieves relevant document chunks from ChromaDB (using hybrid search).
3.  These chunks, along with your query and a prompt, are sent to an LLM (e.g., via Ollama/LangChain).
4.  The LLM generates a comprehensive answer based on the provided context.

## RAG Architecture Overview

Papermind's RAG architecture is composed of several key stages, ensuring efficient and accurate information retrieval and generation:

1.  **Data Ingestion**: Research papers from arXiv are fetched, parsed from PDF to text using `PyMuPDF`, and then segmented into manageable chunks.
2.  **Embedding Generation**: Each text chunk is transformed into a high-dimensional vector embedding using `InstructorEmbedding` (or similar sentence transformers).
3.  **Vector Store (ChromaDB)**: These embeddings, along with their original text and metadata, are stored in ChromaDB for efficient semantic similarity search.
4.  **Retrieval Module**: When a query is received, a hybrid retrieval approach combines:
    *   **Semantic Search**: Query embeddings are matched against document embeddings in ChromaDB.
    *   **Keyword Search**: `rank_bm25` is used for lexical matching to capture relevant keywords.
5.  **Augmentation & Generation**: The top-k relevant document chunks from the retrieval step are used as context. This context, along with the user's query and a structured prompt (`prompts.py`), is fed to a Large Language Model (LLM) via `LangChain` (potentially utilizing local models through `Ollama`).
6.  **Evaluation**: The generated responses are then evaluated against predefined metrics, with results stored in `eval_results.json` and `eval_summary.json` to track RAG system performance.

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

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

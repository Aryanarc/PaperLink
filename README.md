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

To start the API server:

```bash
uvicorn backend.main:app --reload
```
The API will typically be available at `http://127.0.0.1:8000`. You can access the API documentation at `http://127.0.0.1:8000/docs`.

### Data Ingestion

To ingest papers (e.g., from arXiv) into your ChromaDB:

```bash
python backend/ingestion.py
```
*Note: You may need to configure `ingestion.py` or provide command-line arguments to specify what to ingest (e.g., arXiv queries, specific PDFs).*

### Paper Evaluation

To run evaluations on the ingested papers:

```bash
python backend/evaluate.py
```
*Note: `evaluate.py` will likely use predefined prompts and interact with the vector store to retrieve and process information, potentially using local LLMs if configured via Ollama.*

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

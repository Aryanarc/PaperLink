# Papermind

This project contains a FastAPI backend with ChromaDB and a React frontend.

## Dockerized Setup

YouTo run this application using Docker Compose, ensure you have Docker and Docker Compose installed on your system.

1.  **Build and Run the Containers**

    Navigate to the root directory of this project (where `docker-compose.yml` is located) and run the following command:

    ```bash
    docker-compose up --build
    ```

    This command will:
    *   Build the backend Docker image.
    *   Build the frontend Docker image.
    *   Start the backend service, exposing it on port `8000` of your host machine.
    *   Start the frontend service, exposing it on port `3000` of your host machine.
    *   Create a Docker volume named `chroma_data` to persist your ChromaDB data.

2.  **Access the Application**

    Once the services are up and running, you can access the frontend application in your web browser at:

    ```
    http://localhost:3000
    ```

    The backend API will be available at `http://localhost:8000`.

3.  **Stop the Containers**

    To stop the running containers, press `Ctrl+C` in the terminal where `docker-compose up` is running. To stop and remove the containers, networks, and volumes, run:

    ```bash
    docker-compose down -v
    ```

    The `-v` flag will also remove the `chroma_data` volume, so your ChromaDB data will be lost. If you want to keep the data, omit the `-v` flag.

"""
LLM Service for Papermind - Local Mistral Integration via Ollama
Handles all interactions with the local Mistral model
"""

import ollama
import os
from typing import List, Dict, AsyncGenerator


class LLMService:
    """Service for interacting with local Mistral LLM via Ollama"""
    
    def __init__(self):
        # Default to mistral model, can be overridden via environment variable
        self.model_name = os.getenv("OLLAMA_MODEL", "mistral")
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        # System prompt for RAG
        self.system_prompt = """You are a helpful research assistant. Your role is to answer questions about academic papers based on the provided context.

Guidelines:
1. Base your answers primarily on the provided context
2. If the context doesn't contain enough information, acknowledge this
3. Cite specific sections when making claims
4. Be concise but thorough
5. If you're unsure, say so rather than making assumptions"""

    async def stream_chat(
        self, 
        question: str, 
        context_docs: List[Dict[str, any]]
    ) -> AsyncGenerator[str, None]:
        """
        Stream a chat response using the local Mistral model via Ollama
        
        Args:
            question: The user's question
            context_docs: List of relevant document chunks with content and metadata
            
        Yields:
            Token strings from the model's response
        """
        # Format context for the model
        context_text = self._format_context(context_docs)
        
        # Build the user message
        user_message = f"""Context from research papers:

{context_text}

Question: {question}

Please provide a detailed answer based on the context above."""

        try:
            # Create the streaming response from Ollama
            stream = ollama.chat(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                stream=True,
            )
            
            # Stream tokens back to the client
            for chunk in stream:
                if 'message' in chunk and 'content' in chunk['message']:
                    content = chunk['message']['content']
                    if content:
                        yield content
                        
        except Exception as e:
            print(f"Error in Mistral streaming: {e}")
            yield f"\n\n[Error: Failed to get response from Mistral - {str(e)}. Make sure Ollama is running with 'ollama run mistral']"
    
    def _format_context(self, context_docs: List[Dict[str, any]]) -> str:
        """
        Format context documents for the LLM
        
        Args:
            context_docs: List of document chunks with content and metadata
            
        Returns:
            Formatted context string
        """
        formatted_chunks = []
        
        for i, doc in enumerate(context_docs, 1):
            content = doc.get("content", "")
            metadata = doc.get("metadata", {})
            
            source = metadata.get("source", "Unknown")
            page = metadata.get("page", "?")
            
            chunk_text = f"[Document {i} - {source}, Page {page}]\n{content}"
            formatted_chunks.append(chunk_text)
        
        return "\n\n---\n\n".join(formatted_chunks)
    
    def check_connection(self) -> bool:
        """
        Check if Ollama is running and the model is available
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Try to list models to verify connection
            models = ollama.list()
            
            # Check if our model is available
            model_names = [model.get('name', '').split(':')[0] for model in models.get('models', [])]
            
            if self.model_name not in model_names:
                print(f"Warning: Model '{self.model_name}' not found. Available models: {model_names}")
                print(f"Run 'ollama pull {self.model_name}' to download it")
                return False
                
            print(f"✓ Connected to Ollama - Model '{self.model_name}' is ready")
            return True
            
        except Exception as e:
            print(f"✗ Failed to connect to Ollama: {e}")
            print("Make sure Ollama is running: https://ollama.ai")
            return False
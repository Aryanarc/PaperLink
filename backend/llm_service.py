"""
LLM Service for Papermind - HuggingFace Inference API Integration
Handles all interactions with Mistral via HuggingFace (cloud deployment ready)
"""

import os
import httpx
from typing import List, Dict, AsyncGenerator


class LLMService:
    """Service for interacting with Mistral LLM via HuggingFace Inference API"""
    
    def __init__(self):
        # HuggingFace Inference API configuration
        self.api_token = os.getenv("HF_TOKEN", "")
        self.model_id = os.getenv("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"
        
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
        Stream a chat response using HuggingFace Inference API
        
        Args:
            question: The user's question
            context_docs: List of relevant document chunks with content and metadata
            
        Yields:
            Token strings from the model's response
        """
        # Format context for the model
        context_text = self._format_context(context_docs)
        
        # Build the prompt in Mistral instruction format
        prompt = f"""<s>[INST] {self.system_prompt}

Context from research papers:

{context_text}

Question: {question} [/INST]"""

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 1000,
                "temperature": 0.7,
                "top_p": 0.95,
                "return_full_text": False
            },
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", self.api_url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        print(f"HuggingFace API error: {response.status_code} - {error_text}")
                        yield f"\n\n[Error: API returned {response.status_code}. Please check HF_TOKEN in environment variables]"
                        return
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data:"):
                            try:
                                import json
                                data = json.loads(line[5:])
                                if isinstance(data, dict) and "token" in data:
                                    text = data["token"].get("text", "")
                                    if text:
                                        yield text
                                elif isinstance(data, list) and len(data) > 0:
                                    text = data[0].get("generated_text", "")
                                    if text:
                                        yield text
                            except json.JSONDecodeError:
                                continue
                        
        except Exception as e:
            print(f"Error in HuggingFace streaming: {e}")
            yield f"\n\n[Error: {str(e)}. Make sure HF_TOKEN is set correctly]"
    
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

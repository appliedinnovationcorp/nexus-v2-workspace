"""
Vector Service - Vector database operations and semantic search
Handles vector embeddings, similarity search, and semantic operations
"""

import asyncio
from typing import List, Dict, Any, Optional
import numpy as np
import structlog
from datetime import datetime

# Vector database clients
try:
    import pinecone
    from pinecone import Pinecone
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False

try:
    import chromadb
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False

from core.config import Settings

logger = structlog.get_logger()


class VectorService:
    """Vector database service with multiple backend support"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.pinecone_client = None
        self.chroma_client = None
        self.local_vectors = {}  # Fallback in-memory storage
        
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize vector database clients"""
        try:
            # Initialize Pinecone if available and configured
            if (PINECONE_AVAILABLE and 
                self.settings.pinecone_api_key and 
                self.settings.pinecone_environment):
                
                self.pinecone_client = Pinecone(
                    api_key=self.settings.pinecone_api_key,
                    environment=self.settings.pinecone_environment
                )
                logger.info("Pinecone client initialized")
            
            # Initialize ChromaDB as fallback
            if CHROMADB_AVAILABLE:
                self.chroma_client = chromadb.Client()
                logger.info("ChromaDB client initialized")
                
        except Exception as e:
            logger.error("Failed to initialize vector clients", error=str(e))
    
    async def store_vectors(
        self,
        vectors: List[Dict[str, Any]],
        index_name: Optional[str] = None
    ) -> bool:
        """Store vectors in the vector database"""
        
        try:
            if self.pinecone_client:
                return await self._store_vectors_pinecone(vectors, index_name)
            elif self.chroma_client:
                return await self._store_vectors_chroma(vectors, index_name)
            else:
                return await self._store_vectors_local(vectors, index_name)
                
        except Exception as e:
            logger.error("Vector storage failed", error=str(e))
            return False
    
    async def similarity_search(
        self,
        query_vector: List[float],
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        index_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Perform similarity search"""
        
        try:
            if self.pinecone_client:
                return await self._similarity_search_pinecone(query_vector, limit, filters, index_name)
            elif self.chroma_client:
                return await self._similarity_search_chroma(query_vector, limit, filters, index_name)
            else:
                return await self._similarity_search_local(query_vector, limit, filters, index_name)
                
        except Exception as e:
            logger.error("Similarity search failed", error=str(e))
            return []
    
    async def _store_vectors_pinecone(
        self,
        vectors: List[Dict[str, Any]],
        index_name: Optional[str] = None
    ) -> bool:
        """Store vectors in Pinecone"""
        
        index_name = index_name or self.settings.pinecone_index_name
        
        try:
            # Get or create index
            if index_name not in self.pinecone_client.list_indexes().names():
                self.pinecone_client.create_index(
                    name=index_name,
                    dimension=len(vectors[0]["embedding"]),
                    metric="cosine"
                )
            
            index = self.pinecone_client.Index(index_name)
            
            # Prepare vectors for Pinecone format
            pinecone_vectors = []
            for vector in vectors:
                pinecone_vectors.append({
                    "id": vector["id"],
                    "values": vector["embedding"],
                    "metadata": {
                        "title": vector.get("title", ""),
                        "content": vector.get("content", ""),
                        "url": vector.get("url", ""),
                        "content_type": vector.get("content_type", ""),
                        "division": vector.get("division", ""),
                        **vector.get("metadata", {})
                    }
                })
            
            # Upsert vectors in batches
            batch_size = 100
            for i in range(0, len(pinecone_vectors), batch_size):
                batch = pinecone_vectors[i:i + batch_size]
                index.upsert(vectors=batch)
            
            logger.info("Vectors stored in Pinecone", count=len(vectors), index=index_name)
            return True
            
        except Exception as e:
            logger.error("Pinecone vector storage failed", error=str(e))
            return False
    
    async def _similarity_search_pinecone(
        self,
        query_vector: List[float],
        limit: int,
        filters: Optional[Dict[str, Any]],
        index_name: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Perform similarity search in Pinecone"""
        
        index_name = index_name or self.settings.pinecone_index_name
        
        try:
            index = self.pinecone_client.Index(index_name)
            
            # Build filter for Pinecone
            pinecone_filter = {}
            if filters:
                for key, value in filters.items():
                    if isinstance(value, list):
                        pinecone_filter[key] = {"$in": value}
                    else:
                        pinecone_filter[key] = {"$eq": value}
            
            # Perform search
            search_results = index.query(
                vector=query_vector,
                top_k=limit,
                filter=pinecone_filter if pinecone_filter else None,
                include_metadata=True
            )
            
            # Convert results to standard format
            results = []
            for match in search_results.matches:
                result = {
                    "id": match.id,
                    "score": float(match.score),
                    "title": match.metadata.get("title", ""),
                    "content": match.metadata.get("content", ""),
                    "url": match.metadata.get("url"),
                    "content_type": match.metadata.get("content_type", ""),
                    "division": match.metadata.get("division"),
                    "metadata": {k: v for k, v in match.metadata.items() 
                              if k not in ["title", "content", "url", "content_type", "division"]},
                    "embedding": query_vector  # Include query vector if needed
                }
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error("Pinecone similarity search failed", error=str(e))
            return []
    
    async def _store_vectors_chroma(
        self,
        vectors: List[Dict[str, Any]],
        index_name: Optional[str] = None
    ) -> bool:
        """Store vectors in ChromaDB"""
        
        collection_name = index_name or "aic_vectors"
        
        try:
            # Get or create collection
            try:
                collection = self.chroma_client.get_collection(collection_name)
            except:
                collection = self.chroma_client.create_collection(collection_name)
            
            # Prepare data for ChromaDB
            ids = [vector["id"] for vector in vectors]
            embeddings = [vector["embedding"] for vector in vectors]
            metadatas = []
            documents = []
            
            for vector in vectors:
                metadatas.append({
                    "title": vector.get("title", ""),
                    "url": vector.get("url", ""),
                    "content_type": vector.get("content_type", ""),
                    "division": vector.get("division", ""),
                    **vector.get("metadata", {})
                })
                documents.append(vector.get("content", ""))
            
            # Add vectors to collection
            collection.add(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=documents
            )
            
            logger.info("Vectors stored in ChromaDB", count=len(vectors), collection=collection_name)
            return True
            
        except Exception as e:
            logger.error("ChromaDB vector storage failed", error=str(e))
            return False
    
    async def _similarity_search_chroma(
        self,
        query_vector: List[float],
        limit: int,
        filters: Optional[Dict[str, Any]],
        index_name: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Perform similarity search in ChromaDB"""
        
        collection_name = index_name or "aic_vectors"
        
        try:
            collection = self.chroma_client.get_collection(collection_name)
            
            # Build where clause for ChromaDB
            where_clause = {}
            if filters:
                for key, value in filters.items():
                    if isinstance(value, list):
                        where_clause[key] = {"$in": value}
                    else:
                        where_clause[key] = {"$eq": value}
            
            # Perform search
            search_results = collection.query(
                query_embeddings=[query_vector],
                n_results=limit,
                where=where_clause if where_clause else None,
                include=["metadatas", "documents", "distances"]
            )
            
            # Convert results to standard format
            results = []
            if search_results["ids"] and search_results["ids"][0]:
                for i, doc_id in enumerate(search_results["ids"][0]):
                    metadata = search_results["metadatas"][0][i] if search_results["metadatas"] else {}
                    document = search_results["documents"][0][i] if search_results["documents"] else ""
                    distance = search_results["distances"][0][i] if search_results["distances"] else 0
                    
                    # Convert distance to similarity score (ChromaDB uses distance, we want similarity)
                    score = 1.0 - distance if distance <= 1.0 else 1.0 / (1.0 + distance)
                    
                    result = {
                        "id": doc_id,
                        "score": float(score),
                        "title": metadata.get("title", ""),
                        "content": document,
                        "url": metadata.get("url"),
                        "content_type": metadata.get("content_type", ""),
                        "division": metadata.get("division"),
                        "metadata": {k: v for k, v in metadata.items() 
                                  if k not in ["title", "url", "content_type", "division"]},
                        "embedding": query_vector
                    }
                    results.append(result)
            
            return results
            
        except Exception as e:
            logger.error("ChromaDB similarity search failed", error=str(e))
            return []
    
    async def _store_vectors_local(
        self,
        vectors: List[Dict[str, Any]],
        index_name: Optional[str] = None
    ) -> bool:
        """Store vectors in local memory (fallback)"""
        
        index_name = index_name or "default"
        
        try:
            if index_name not in self.local_vectors:
                self.local_vectors[index_name] = []
            
            self.local_vectors[index_name].extend(vectors)
            
            logger.info("Vectors stored locally", count=len(vectors), index=index_name)
            return True
            
        except Exception as e:
            logger.error("Local vector storage failed", error=str(e))
            return False
    
    async def _similarity_search_local(
        self,
        query_vector: List[float],
        limit: int,
        filters: Optional[Dict[str, Any]],
        index_name: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Perform similarity search in local memory"""
        
        index_name = index_name or "default"
        
        try:
            if index_name not in self.local_vectors:
                return []
            
            vectors = self.local_vectors[index_name]
            query_array = np.array(query_vector)
            
            # Calculate similarities
            similarities = []
            for vector in vectors:
                # Apply filters
                if filters:
                    skip = False
                    for key, value in filters.items():
                        vector_value = vector.get(key) or vector.get("metadata", {}).get(key)
                        if isinstance(value, list):
                            if vector_value not in value:
                                skip = True
                                break
                        else:
                            if vector_value != value:
                                skip = True
                                break
                    if skip:
                        continue
                
                # Calculate cosine similarity
                vector_array = np.array(vector["embedding"])
                similarity = np.dot(query_array, vector_array) / (
                    np.linalg.norm(query_array) * np.linalg.norm(vector_array)
                )
                
                similarities.append({
                    "vector": vector,
                    "similarity": float(similarity)
                })
            
            # Sort by similarity and take top results
            similarities.sort(key=lambda x: x["similarity"], reverse=True)
            top_results = similarities[:limit]
            
            # Convert to standard format
            results = []
            for item in top_results:
                vector = item["vector"]
                result = {
                    "id": vector["id"],
                    "score": item["similarity"],
                    "title": vector.get("title", ""),
                    "content": vector.get("content", ""),
                    "url": vector.get("url"),
                    "content_type": vector.get("content_type", ""),
                    "division": vector.get("division"),
                    "metadata": vector.get("metadata", {}),
                    "embedding": vector["embedding"]
                }
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error("Local similarity search failed", error=str(e))
            return []
    
    async def delete_vectors(
        self,
        vector_ids: List[str],
        index_name: Optional[str] = None
    ) -> bool:
        """Delete vectors by IDs"""
        
        try:
            if self.pinecone_client:
                return await self._delete_vectors_pinecone(vector_ids, index_name)
            elif self.chroma_client:
                return await self._delete_vectors_chroma(vector_ids, index_name)
            else:
                return await self._delete_vectors_local(vector_ids, index_name)
                
        except Exception as e:
            logger.error("Vector deletion failed", error=str(e))
            return False
    
    async def _delete_vectors_pinecone(
        self,
        vector_ids: List[str],
        index_name: Optional[str]
    ) -> bool:
        """Delete vectors from Pinecone"""
        
        index_name = index_name or self.settings.pinecone_index_name
        
        try:
            index = self.pinecone_client.Index(index_name)
            index.delete(ids=vector_ids)
            
            logger.info("Vectors deleted from Pinecone", count=len(vector_ids))
            return True
            
        except Exception as e:
            logger.error("Pinecone vector deletion failed", error=str(e))
            return False
    
    async def _delete_vectors_chroma(
        self,
        vector_ids: List[str],
        index_name: Optional[str]
    ) -> bool:
        """Delete vectors from ChromaDB"""
        
        collection_name = index_name or "aic_vectors"
        
        try:
            collection = self.chroma_client.get_collection(collection_name)
            collection.delete(ids=vector_ids)
            
            logger.info("Vectors deleted from ChromaDB", count=len(vector_ids))
            return True
            
        except Exception as e:
            logger.error("ChromaDB vector deletion failed", error=str(e))
            return False
    
    async def _delete_vectors_local(
        self,
        vector_ids: List[str],
        index_name: Optional[str]
    ) -> bool:
        """Delete vectors from local storage"""
        
        index_name = index_name or "default"
        
        try:
            if index_name in self.local_vectors:
                self.local_vectors[index_name] = [
                    v for v in self.local_vectors[index_name] 
                    if v["id"] not in vector_ids
                ]
            
            logger.info("Vectors deleted locally", count=len(vector_ids))
            return True
            
        except Exception as e:
            logger.error("Local vector deletion failed", error=str(e))
            return False
    
    async def get_index_stats(self, index_name: Optional[str] = None) -> Dict[str, Any]:
        """Get statistics about the vector index"""
        
        try:
            if self.pinecone_client:
                return await self._get_pinecone_stats(index_name)
            elif self.chroma_client:
                return await self._get_chroma_stats(index_name)
            else:
                return await self._get_local_stats(index_name)
                
        except Exception as e:
            logger.error("Failed to get index stats", error=str(e))
            return {"error": str(e)}
    
    async def _get_pinecone_stats(self, index_name: Optional[str]) -> Dict[str, Any]:
        """Get Pinecone index statistics"""
        
        index_name = index_name or self.settings.pinecone_index_name
        
        try:
            index = self.pinecone_client.Index(index_name)
            stats = index.describe_index_stats()
            
            return {
                "provider": "pinecone",
                "index_name": index_name,
                "total_vectors": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": dict(stats.namespaces) if stats.namespaces else {}
            }
            
        except Exception as e:
            logger.error("Failed to get Pinecone stats", error=str(e))
            return {"error": str(e)}
    
    async def _get_chroma_stats(self, index_name: Optional[str]) -> Dict[str, Any]:
        """Get ChromaDB collection statistics"""
        
        collection_name = index_name or "aic_vectors"
        
        try:
            collection = self.chroma_client.get_collection(collection_name)
            count = collection.count()
            
            return {
                "provider": "chromadb",
                "collection_name": collection_name,
                "total_vectors": count,
                "dimension": "unknown",  # ChromaDB doesn't expose this easily
                "metadata": collection.metadata
            }
            
        except Exception as e:
            logger.error("Failed to get ChromaDB stats", error=str(e))
            return {"error": str(e)}
    
    async def _get_local_stats(self, index_name: Optional[str]) -> Dict[str, Any]:
        """Get local storage statistics"""
        
        index_name = index_name or "default"
        
        try:
            if index_name in self.local_vectors:
                vectors = self.local_vectors[index_name]
                total_count = len(vectors)
                dimension = len(vectors[0]["embedding"]) if vectors else 0
            else:
                total_count = 0
                dimension = 0
            
            return {
                "provider": "local",
                "index_name": index_name,
                "total_vectors": total_count,
                "dimension": dimension,
                "memory_usage": f"{total_count * dimension * 4} bytes"  # Rough estimate
            }
            
        except Exception as e:
            logger.error("Failed to get local stats", error=str(e))
            return {"error": str(e)}
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health of vector services"""
        
        health_status = {
            "status": "healthy",
            "providers": {}
        }
        
        # Check Pinecone
        if self.pinecone_client:
            try:
                # Simple health check - list indexes
                indexes = self.pinecone_client.list_indexes()
                health_status["providers"]["pinecone"] = "healthy"
            except Exception as e:
                health_status["providers"]["pinecone"] = f"unhealthy: {str(e)}"
        
        # Check ChromaDB
        if self.chroma_client:
            try:
                # Simple health check - list collections
                collections = self.chroma_client.list_collections()
                health_status["providers"]["chromadb"] = "healthy"
            except Exception as e:
                health_status["providers"]["chromadb"] = f"unhealthy: {str(e)}"
        
        # Local storage is always available
        health_status["providers"]["local"] = "healthy"
        
        # Overall status
        if any("unhealthy" in status for status in health_status["providers"].values()):
            health_status["status"] = "degraded"
        
        return health_status
    
    async def close(self):
        """Close all connections"""
        # Pinecone and ChromaDB clients don't need explicit closing
        self.local_vectors.clear()
        logger.info("Vector service connections closed")

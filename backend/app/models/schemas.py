"""
Pydantic models for API request/response validation.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ============================================================================
# DOCUMENT SCHEMAS
# ============================================================================

class TextProcessRequest(BaseModel):
    """Request to process pasted text."""
    text: str = Field(..., min_length=1, description="Text content to process")
    title: Optional[str] = Field(None, description="Optional title for the document")


class DocumentUploadResponse(BaseModel):
    """Response after document upload and processing."""
    success: bool
    document_id: str
    title: str
    chunks_created: int
    links_extracted: int = 0
    images_extracted: int = 0
    processing_time_ms: float


# ============================================================================
# CHAT SCHEMAS
# ============================================================================

class ChatMessage(BaseModel):
    """Single chat message in history."""
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class QueryRequest(BaseModel):
    """Request for RAG query with chat history."""
    query: str = Field(..., min_length=1, description="User query")
    session_id: Optional[str] = Field(None, description="Session ID for chat history")
    chat_history: Optional[List[ChatMessage]] = Field(
        default_factory=list,
        description="Previous conversation turns"
    )


class SourceReference(BaseModel):
    """A single source reference with metadata."""
    id: int = Field(..., description="Citation ID [1], [2], etc.")
    text: str = Field(..., description="Chunk text snippet")
    document: str = Field(..., description="Source document name")
    links: List[str] = Field(default_factory=list, description="URLs found in chunk")
    images: List[str] = Field(default_factory=list, description="Image references")
    score: float = Field(..., description="Relevance score (after reranking)")
    chunk_id: Optional[str] = None
    section: Optional[str] = None


class TimingInfo(BaseModel):
    """Timing information for pipeline stages."""
    retrieval_ms: float
    rerank_ms: float
    llm_ms: float
    total_ms: float


class TokenUsage(BaseModel):
    """Token usage and cost estimation."""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float


class QueryResponse(BaseModel):
    """Response for RAG query."""
    answer: str = Field(..., description="LLM-generated answer with citations")
    sources: List[SourceReference] = Field(
        default_factory=list,
        description="Source references"
    )
    has_context: bool = Field(..., description="Whether relevant context was found")
    general_answer: Optional[str] = Field(
        None,
        description="General knowledge answer (if no context available)"
    )
    timing: TimingInfo
    token_usage: Optional[TokenUsage] = None
    session_id: Optional[str] = None


# ============================================================================
# RETRIEVAL INTERNAL SCHEMAS (not exposed in API)
# ============================================================================

class ChunkMetadata(BaseModel):
    """Metadata stored with each chunk in vector DB."""
    source: str
    title: str
    section: Optional[str] = None
    chunk_id: str
    links: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class RetrievedChunk(BaseModel):
    """A chunk retrieved from vector DB before reranking."""
    chunk_id: str
    text: str
    score: float
    metadata: ChunkMetadata


class RerankedChunk(BaseModel):
    """A chunk after reranking."""
    chunk_id: str
    text: str
    score: float  # Reranker score
    original_score: float  # Original vector similarity
    metadata: ChunkMetadata


# ============================================================================
# HEALTH CHECK
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    qdrant_connected: bool
    openai_configured: bool
    cohere_configured: bool
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
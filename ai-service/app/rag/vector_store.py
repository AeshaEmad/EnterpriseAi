import logging

from langchain_qdrant import (
    QdrantVectorStore,
    RetrievalMode,
)
from qdrant_client import QdrantClient

from app.rag.config import RAGConfig
from app.rag.embeddings import (
    get_dense_embeddings,
    get_sparse_embeddings,
)

logger = logging.getLogger("ai_service.rag.vector_store")


def _collection_exists() -> bool:
    try:
        client = QdrantClient(
            url=RAGConfig.QDRANT_URL,
            api_key=RAGConfig.QDRANT_API_KEY or None,
        )
        return client.collection_exists(collection_name=RAGConfig.COLLECTION_NAME)
    except Exception:
        logger.warning(
            "Could not confirm whether Qdrant collection '%s' exists; assuming it is missing.",
            RAGConfig.COLLECTION_NAME,
        )
        return False


def create_vector_store():
    if not _collection_exists():
        logger.warning(
            "Qdrant collection '%s' was not found. Triggering automatic ingestion.",
            RAGConfig.COLLECTION_NAME,
        )
        from app.rag.ingest import ingest_documents

        ingest_documents()

    return QdrantVectorStore.from_existing_collection(
        embedding=get_dense_embeddings(),
        sparse_embedding=get_sparse_embeddings(),
        collection_name=RAGConfig.COLLECTION_NAME,
        url=RAGConfig.QDRANT_URL,
        api_key=RAGConfig.QDRANT_API_KEY or None,
        retrieval_mode=RetrievalMode.HYBRID,
    )
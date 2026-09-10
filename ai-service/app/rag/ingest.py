import logging

from langchain_qdrant import (
    QdrantVectorStore,
    RetrievalMode,
)

from app.rag.config import RAGConfig
from app.rag.document_loader import (
    load_documents,
    split_documents,
)
from app.rag.embeddings import (
    get_dense_embeddings,
    get_sparse_embeddings,
)

logger = logging.getLogger("ai_service.rag.ingest")


def ingest_documents():
    documents = load_documents()

    if not documents:
        raise ValueError("No documents found for ingestion.")

    chunks = split_documents(documents)
    logger.info("Loaded %s source documents", len(documents))
    logger.info("Created %s document chunks", len(chunks))

    try:
        QdrantVectorStore.from_documents(
            documents=chunks,
            embedding=get_dense_embeddings(),
            sparse_embedding=get_sparse_embeddings(),
            collection_name=RAGConfig.COLLECTION_NAME,
            url=RAGConfig.QDRANT_URL,
            api_key=RAGConfig.QDRANT_API_KEY or None,
            retrieval_mode=RetrievalMode.HYBRID,
        )
        logger.info("Indexed documents into '%s'", RAGConfig.COLLECTION_NAME)
        return True
    except Exception:
        logger.exception("Failed to ingest documents into Qdrant")
        raise


if __name__ == "__main__":
    ingest_documents()
    
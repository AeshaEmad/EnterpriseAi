from langchain_qdrant import (
    QdrantVectorStore,
    RetrievalMode,
)

from app.rag.config import RAGConfig
from app.rag.embeddings import (
    get_dense_embeddings,
    get_sparse_embeddings,
)


def create_vector_store():

    return QdrantVectorStore.from_existing_collection(
        embedding=get_dense_embeddings(),
        sparse_embedding=get_sparse_embeddings(),
        collection_name=RAGConfig.COLLECTION_NAME,
        url=RAGConfig.QDRANT_URL,
        api_key=RAGConfig.QDRANT_API_KEY or None,
        retrieval_mode=RetrievalMode.HYBRID,
    )
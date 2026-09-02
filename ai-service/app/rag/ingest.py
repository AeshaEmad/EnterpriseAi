print("INGEST MODULE LOADED")
from app.rag.config import RAGConfig
from app.rag.document_loader import (
    load_documents,
    split_documents,
)
from app.rag.embeddings import (
    get_dense_embeddings,
    get_sparse_embeddings,
)

from langchain_qdrant import (
    QdrantVectorStore,
    RetrievalMode,
)


def ingest_documents():

    documents = load_documents()

    if not documents:
        raise ValueError(
            "No documents found."
        )

    chunks = split_documents(
        documents
    )

    print(
        f"Loaded {len(documents)} documents."
    )

    print(
        f"Created {len(chunks)} chunks."
    )

    QdrantVectorStore.from_documents(
        documents=chunks,
        embedding=get_dense_embeddings(),
        sparse_embedding=get_sparse_embeddings(),
        collection_name=RAGConfig.COLLECTION_NAME,
        url=RAGConfig.QDRANT_URL,
        api_key=RAGConfig.QDRANT_API_KEY or None,
        retrieval_mode=RetrievalMode.HYBRID,
    )

    print(
        f"Indexed documents into "
        f"'{RAGConfig.COLLECTION_NAME}'."
    )


if __name__ == "__main__":   

    ingest_documents()
    
import os

from dotenv import load_dotenv


load_dotenv()


class RAGConfig:
    QDRANT_URL = os.getenv(
        "QDRANT_URL",
        "http://localhost:6333",
    )

    QDRANT_API_KEY = os.getenv(
        "QDRANT_API_KEY",
        "",
    )

    COLLECTION_NAME = os.getenv(
        "QDRANT_COLLECTION",
        "enterprise_business_knowledge",
    )

    DENSE_MODEL = os.getenv(
        "RAG_DENSE_MODEL",
        "BAAI/bge-small-en-v1.5",
    )

    SPARSE_MODEL = os.getenv(
        "RAG_SPARSE_MODEL",
        "Qdrant/bm25",
    )

    TOP_K = int(
        os.getenv(
            "RAG_TOP_K",
            "5",
        )
    )
import logging

from app.rag.config import RAGConfig
from app.rag.vector_store import create_vector_store

logger = logging.getLogger("ai_service.rag.retriever")


class BusinessKnowledgeRetriever:

    def __init__(self):
        self.vector_store = create_vector_store()
        self.retriever = self.vector_store.as_retriever(
            search_kwargs={"k": RAGConfig.TOP_K}
        )

    def retrieve(
        self,
        query: str,
    ):
        logger.info("Retrieving up to %s business knowledge documents", RAGConfig.TOP_K)
        documents = self.retriever.invoke(query)
        logger.info("Retrieved %s business knowledge documents", len(documents))
        return documents


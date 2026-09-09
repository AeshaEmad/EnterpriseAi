from app.rag.config import RAGConfig
from app.rag.vector_store import (
    create_vector_store,
)


class BusinessKnowledgeRetriever:

    def __init__(self):
        try:
            self.vector_store = create_vector_store()
            self.retriever = self.vector_store.as_retriever(
                search_kwargs={"k": RAGConfig.TOP_K}
            )
        except Exception as e:
            print(f"Warning: Qdrant vector store initialization failed ({e}). RAG retrieval is disabled.")
            self.vector_store = None
            self.retriever = None

    def retrieve(self, query: str):
        if not self.retriever:
            return []
        try:
            return self.retriever.invoke(query)
        except Exception as e:
            print(f"Warning: Qdrant retrieval failed ({e}). Returning empty results.")
            return []



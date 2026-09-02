from app.rag.config import RAGConfig
from app.rag.vector_store import (
    create_vector_store,
)


class BusinessKnowledgeRetriever:

    def __init__(self):

        self.vector_store = (
            create_vector_store()
        )

        self.retriever = (
            self.vector_store.as_retriever(
                search_kwargs={
                    "k": RAGConfig.TOP_K
                }
            )
        )

    def retrieve(
        self,
        query: str,
    ):
        return self.retriever.invoke(
            query
        )



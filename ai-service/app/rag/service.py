from typing import Any

from app.extraction.extractor import Extractor
from app.rag.router import RAGRouter
from app.rag.retriever import BusinessKnowledgeRetriever


class RAGService:

    def __init__(
        self,
        router: RAGRouter,
        retriever: BusinessKnowledgeRetriever,
        extractor: Extractor,
    ):
        self.router = router
        self.retriever = retriever
        self.extractor = extractor

    def process(
        self,
        form_schema: dict[str, Any],
        user_input: str,
        context: dict[str, Any] | None = None,
    ):
        if context is None:
            context = {
                "existingValues": {},
                "conversation": [],
            }

        use_rag = self.router.route(
            user_input
        )

        if use_rag:
            documents = self.retriever.retrieve(
                user_input
            )

            business_knowledge = [
                {
                    "content": document.page_content,
                    "source": document.metadata.get(
                        "source"
                    ),
                }
                for document in documents
            ]

            context["businessKnowledge"] = (
                business_knowledge
            )

        return self.extractor.extract(
            form_schema=form_schema,
            user_input=user_input,
            context=context,
        )
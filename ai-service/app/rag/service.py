import logging
from typing import Any

from app.extraction.extractor import Extractor
from app.rag.router import RAGRouter
from app.rag.retriever import BusinessKnowledgeRetriever

logger = logging.getLogger("ai_service.rag.service")


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

        logger.info("Processing extraction request with user_input=%s", user_input[:120])
        use_rag = self.router.route(user_input)
        logger.info("RAG decision for request: %s", use_rag)

        if use_rag:
            documents = self.retriever.retrieve(user_input)
            business_knowledge = [
                {
                    "content": document.page_content,
                    "source": document.metadata.get("source"),
                }
                for document in documents
            ]
            context["businessKnowledge"] = business_knowledge
            logger.info("Attached %s business knowledge items to context", len(business_knowledge))

        return self.extractor.extract(
            form_schema=form_schema,
            user_input=user_input,
            context=context,
        )
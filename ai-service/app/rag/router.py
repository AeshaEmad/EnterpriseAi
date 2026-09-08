import logging
from pathlib import Path

from app.rag.router_client import RouterClient

logger = logging.getLogger("ai_service.rag.router")


class RAGRouter:

    def __init__(
        self,
        router_client: RouterClient,
    ):
        self.router_client = router_client
        self.system_prompt = self._load_prompt()

    @staticmethod
    def _load_prompt() -> str:
        prompt_path = (
            Path(__file__).resolve().parents[2]
            / "prompts"
            / "rag_router_system.txt"
        )
        return prompt_path.read_text(encoding="utf-8")

    def route(
        self,
        user_input: str,
    ) -> bool:
        try:
            result = self.router_client.classify(
                system_prompt=self.system_prompt,
                user_input=user_input,
            )
            use_rag = bool(result.get("use_rag", False))
            logger.info("RAG router result: use_rag=%s reason=%s", use_rag, result.get("reason"))
            return use_rag
        except Exception:
            logger.exception("RAG routing failed; defaulting to no-RAG mode")
            return False
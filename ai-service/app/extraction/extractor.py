import json
from typing import Any

from app.llm.ollama_client import OllamaClient


class Extractor:
    def __init__(self, ollama_client: OllamaClient, system_prompt: str):
        self.ollama_client = ollama_client
        self.system_prompt = system_prompt

    def extract(
        self,
        form_schema: dict[str, Any],
        conversation_context: list[dict[str, str]],
        current_user_message: str,
    ) -> str:

        user_input = {
            "FORM_SCHEMA": form_schema,
            "CONVERSATION_CONTEXT": conversation_context,
            "CURRENT_USER_MESSAGE": current_user_message,
        }

        user_message = json.dumps(
            user_input,
            ensure_ascii=False,
        )

        return self.ollama_client.generate(
            system_prompt=self.system_prompt,
            user_message=user_message,
        )
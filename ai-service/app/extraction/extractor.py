import json
from typing import Any

from app.llm.ollama_client import OllamaClient
from app.models.extraction import ExtractionResponse


class Extractor:
    def __init__(
        self,
        ollama_client: OllamaClient,
        system_prompt: str,
    ):
        self.ollama_client = ollama_client
        self.system_prompt = system_prompt

    def extract(
        self,
        form_schema: dict[str, Any],
        user_input: str,
        context: dict[str, Any],
    ) -> ExtractionResponse:

        extraction_input = {
            "form_schema": form_schema,
            "user_input": user_input,
            "context": context,
        }

        user_message = json.dumps(
            extraction_input,
            ensure_ascii=False,
        )

        raw_response = self.ollama_client.generate(
            system_prompt=self.system_prompt,
            user_message=user_message,
        )

        parsed_response = json.loads(raw_response)

        return ExtractionResponse.model_validate(
            parsed_response
        )
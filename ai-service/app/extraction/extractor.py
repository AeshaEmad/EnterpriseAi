import json
import logging
from typing import Any

from app.llm.ollama_client import OllamaClient
from app.models.extraction import ExtractionResponse
from app.validation import validate_json_against_schema

logger = logging.getLogger("ai_service.extractor")


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

        last_error = None
        for attempt in range(3):
            try:
                raw_response = self.ollama_client.generate(
                    system_prompt=self.system_prompt,
                    user_message=user_message,
                )
                parsed_response = self._parse_response(raw_response)
                validate_json_against_schema(parsed_response)
                parsed_response["modelName"] = self.ollama_client.model
                values = parsed_response.get("values", {})
                parsed_response["values"] = {
                    field: {
                        "value": value.get("value"),
                        "confidence": value.get("confidence") ,
                    }
                    if isinstance(value, dict) and "value" in value
                    else {"value": value, "confidence": 0.5}
                    for field, value in values.items()
                    if value is not None
                }
                logger.info("Extractor produced a valid response on attempt %s", attempt + 1)
                return ExtractionResponse.model_validate(parsed_response)
            except (ValueError, TypeError, json.JSONDecodeError) as exc:
                last_error = exc
                logger.warning(
                    "LLM extraction validation failed on attempt %s/3: %s",
                    attempt + 1,
                    exc,
                )

        raise RuntimeError(
            f"Extraction failed after 3 attempts: {last_error}"
        ) from last_error

    @staticmethod
    def _parse_response(raw_response: str) -> dict[str, Any]:
        cleaned = raw_response.strip()

        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            cleaned = cleaned.rsplit("```", 1)[0].strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start == -1 or end <= start:
                raise ValueError("Unable to parse LLM JSON response")
            return json.loads(cleaned[start : end + 1])
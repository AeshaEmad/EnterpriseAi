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

        parsed_response = self._parse_response(raw_response)
        parsed_response["modelName"] = self.ollama_client.model
        values = parsed_response.get("values", {})
        values = {
            field: {
                "value": value.get("value"),
                "confidence": value.get("confidence") or 0.5,
            }
            if isinstance(value, dict) and "value" in value
            else {"value": value, "confidence": 0.5}
            for field, value in values.items()
            if value is not None
        }

        # Post-process: enforce schema authority over the model's output.
        # Small local models often invent values for required fields the user
        # never mentioned, or ignore the missingFields/clarifications contract.
        # Compute missing fields and clarifications deterministically instead.
        values, missing, clarifications = self._apply_schema_contract(
            form_schema,
            user_input,
            values,
        )

        parsed_response["values"] = values
        if missing:
            parsed_response["missingFields"] = missing
        if clarifications:
            parsed_response["clarifications"] = clarifications

        return ExtractionResponse.model_validate(
            parsed_response
        )

    @staticmethod
    def _apply_schema_contract(
        form_schema: dict[str, Any],
        user_input: str,
        values: dict[str, Any],
    ) -> tuple[dict[str, Any], list[str], list[dict[str, Any]]]:
        """Drop invented values and derive missing/clarification fields from
        the schema, independent of the (unreliable) small LLM."""
        fields = form_schema.get("fields") or []
        by_name = {}
        for f in fields:
            fname = f.get("name")
            if fname:
                by_name[fname] = f

        # Keep only values whose field exists in the schema.
        filtered = {}
        for name, entry in values.items():
            if name not in by_name:
                continue
            filtered[name] = entry

        # Core anti-invention guard: a value is ONLY trusted when the user
        # actually mentioned it. Small local LLMs invent plausible values, so
        # for enum/select fields require an exact token match in the input.
        input_lower = (user_input or "").lower()
        for name, entry in list(filtered.items()):
            field = by_name[name]
            options = field.get("options")
            raw_value = entry["value"]
            raw_text = str(raw_value).strip()
            if not raw_text:
                del filtered[name]
                continue

            if options:
                # Strict: the proposed enum value must literally appear in input.
                if raw_text.lower() not in input_lower:
                    del filtered[name]
                continue

            # Non-enum required field: if the user did not mention it at all,
            # treat as missing rather than letting the model guess.
            if field.get("required") and raw_text.lower() not in input_lower:
                del filtered[name]

        missing = []
        clarifications = []
        for name, field in by_name.items():
            if not field.get("required"):
                continue
            entry = filtered.get(name)
            if entry is None or entry["value"] is None:
                missing.append(name)
                clarifications.append(
                    {
                        "field": name,
                        "question": f"What is the {field.get('label', name)}?",
                        "suggestions": field.get("options") or [],
                    }
                )

        return filtered, missing, clarifications

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
                raise
            return json.loads(cleaned[start : end + 1])

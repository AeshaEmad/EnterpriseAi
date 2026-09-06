import json
import logging
import os

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ai_service.ollama")


class OllamaClient:
    def __init__(self):
        self.base_url = os.getenv(
            "OLLAMA_BASE_URL",
            "http://localhost:11434",
        )

        self.model = os.getenv(
            "OLLAMA_MODEL",
            "qwen3:0.6b",
        )

        self.timeout_seconds = float(
            os.getenv("OLLAMA_TIMEOUT_SECONDS", "180")
        )

    def generate(
        self,
        system_prompt: str,
        user_message: str,
    ) -> str:
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_message,
                },
            ],
            "options": {
                "temperature": 0,
            },
            "format": "json",
            "think": False,
            "stream": False,
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.exception("Ollama request failed")
            raise RuntimeError(f"Ollama request failed: {exc}") from exc

        try:
            data = response.json()
        except (ValueError, json.JSONDecodeError) as exc:
            logger.exception("Ollama returned a non-JSON response")
            raise RuntimeError("Ollama returned a non-JSON response") from exc

        try:
            content = data["message"]["content"]
        except (KeyError, TypeError, ValueError) as exc:
            logger.exception("Ollama response body was malformed")
            raise RuntimeError("Ollama response body was malformed") from exc

        if not isinstance(content, str):
            raise RuntimeError("Ollama response content was not a string")

        return content
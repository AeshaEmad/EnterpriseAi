import json
import logging
import os

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ai_service.rag.router_client")


class RouterClient:

    def __init__(self):
        self.base_url = os.getenv(
            "OLLAMA_BASE_URL",
            "http://localhost:11434",
        )

        self.model = os.getenv(
            "RAG_ROUTER_MODEL",
            "qwen3:0.6b",
        )

    def classify(
        self,
        system_prompt: str,
        user_input: str,
    ) -> dict:
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_input,
                },
            ],
            "stream": False,
            "think": False,
            "format": "json",
            "options": {
                "temperature": 0,
            },
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.exception("Router classification request failed")
            raise RuntimeError(f"Router classification request failed: {exc}") from exc

        try:
            data = response.json()
            content = data["message"]["content"]
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
            logger.exception("Router classification response was malformed")
            raise RuntimeError("Router classification response was malformed") from exc

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            logger.exception("Router returned non-JSON content")
            raise RuntimeError("Router returned non-JSON content") from exc
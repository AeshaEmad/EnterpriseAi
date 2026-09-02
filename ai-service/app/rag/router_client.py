import json
import os

import requests
from dotenv import load_dotenv


load_dotenv()


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

        response = requests.post(
            f"{self.base_url}/api/chat",
            json={
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
            },
            timeout=60,
        )

        response.raise_for_status()

        data = response.json()

        content = data["message"]["content"]

        return json.loads(content)
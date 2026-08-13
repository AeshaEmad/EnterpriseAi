import os

import requests
from dotenv import load_dotenv

load_dotenv()


class OllamaClient:
    def __init__(self):
        self.base_url = os.getenv(
            "OLLAMA_BASE_URL",
            "http://localhost:11434"
        )
        self.model = os.getenv(
            "OLLAMA_MODEL",
            "qwen3:4b"
        )

    def generate(self, prompt: str) -> str:
        response = requests.post(
            f"{self.base_url}/api/chat",
            json={
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()

        data = response.json()

        return data["message"]["content"]
from pathlib import Path

from app.extraction.extractor import Extractor
from app.llm.ollama_client import OllamaClient


def load_system_prompt() -> str:
    prompt_path = (
        Path(__file__).resolve().parent.parent
        / "prompts"
        / "auto_filler_system_v1.1.txt"
    )

    return prompt_path.read_text(encoding="utf-8")


def create_extractor() -> Extractor:
    ollama_client = OllamaClient()
    system_prompt = load_system_prompt()

    return Extractor(
        ollama_client=ollama_client,
        system_prompt=system_prompt,
    )


if __name__ == "__main__":

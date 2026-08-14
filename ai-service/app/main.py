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
    print("Starting AI extraction...")

    extractor = create_extractor()

    form_schema = {
        "fields": [
            {
                "id": "employee_id",
                "type": "string",
                "required": True,
            },
            {
                "id": "department",
                "type": "string",
                "required": True,
            },
            {
                "id": "work_mode",
                "type": "string",
                "required": False,
                "allowedValues": [
                    "Remote",
                    "Hybrid",
                    "On-site",
                ],
            },
        ]
    }

    conversation_context = []

    current_user_message = (
        "Employee 1042 works in Engineering and uses Hybrid mode."
    )

    print("Sending request to Qwen3:4B...")

    result = extractor.extract(
        form_schema=form_schema,
        conversation_context=conversation_context,
        current_user_message=current_user_message,
    )

    print("AI response received.")
    print("\n--- AI Response ---")
    print(result)
    print("-------------------")
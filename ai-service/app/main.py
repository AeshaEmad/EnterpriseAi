from pathlib import Path

import uvicorn
from fastapi import FastAPI

from app.extraction.extractor import Extractor
from app.llm.ollama_client import OllamaClient
from app.models.extraction import (
    ExtractionRequest,
    ExtractionResponse,
)


app = FastAPI(
    title="EnterpriseAI AI Service",
    version="1.1",
)


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


extractor = create_extractor()


@app.post(
    "/api/v1/extract",
    response_model=ExtractionResponse,
)
def extract(request: ExtractionRequest):
    result = extractor.extract(
        form_schema=request.form_schema.model_dump(),
        user_input=request.user_input,
        context=request.context.model_dump(),
    )

    return result


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

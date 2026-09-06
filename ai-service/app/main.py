import logging
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from starlette.status import HTTP_503_SERVICE_UNAVAILABLE

from app.extraction.extractor import Extractor
from app.llm.ollama_client import OllamaClient
from app.models.extraction import (
    ExtractionRequest,
    ExtractionResponse,
)
from app.rag.router import RAGRouter
from app.rag.router_client import RouterClient
from app.rag.retriever import BusinessKnowledgeRetriever
from app.rag.service import RAGService
from app.validation import validate_json_against_schema

logger = logging.getLogger("ai_service.main")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


def load_system_prompt() -> str:
    prompt_path = (
        Path(__file__).resolve().parent.parent
        / "prompts"
        / "auto_filler_system_v1.1.txt"
    )
    return prompt_path.read_text(encoding="utf-8")


def create_rag_service() -> RAGService:
    ollama_client = OllamaClient()
    system_prompt = load_system_prompt()
    extractor = Extractor(
        ollama_client=ollama_client,
        system_prompt=system_prompt,
    )
    router_client = RouterClient()
    rag_router = RAGRouter(router_client=router_client)
    retriever = BusinessKnowledgeRetriever()
    return RAGService(
        router=rag_router,
        retriever=retriever,
        extractor=extractor,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI service startup")
    app.state.rag_service = None
    try:
        app.state.rag_service = create_rag_service()
        logger.info("AI service dependencies initialized successfully")
        yield
    except Exception:
        logger.exception("AI service startup failed; dependencies unavailable")
        app.state.rag_service = None
        raise
    finally:
        logger.info("AI service shutdown complete")


app = FastAPI(
    title="EnterpriseAI AI Service",
    version="1.1",
    lifespan=lifespan,
)


@app.post(
    "/api/v1/extract",
    response_model=ExtractionResponse,
)
async def extract(request: ExtractionRequest):
    service = getattr(app.state, "rag_service", None)
    if service is None:
        raise HTTPException(
            status_code=HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service unavailable because required external dependencies could not be initialized.",
        )

    payload = request.model_dump()
    if not payload.get("form_schema") or not payload.get("user_input"):
        raise HTTPException(
            status_code=400,
            detail="Request payload is missing form_schema or user_input.",
        )

    try:
        result = service.process(
            form_schema=request.form_schema.model_dump(),
            user_input=request.user_input,
            context=request.context.model_dump(),
        )
        validate_json_against_schema(result.model_dump())
        logger.info("Request completed successfully for user input: %s", request.user_input[:120])
        return result
    except (RuntimeError, ValueError) as exc:
        logger.exception("AI extraction request failed")
        raise HTTPException(
            status_code=HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )
import io
from pathlib import Path

import uvicorn
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from pypdf import PdfReader

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

    return prompt_path.read_text(
        encoding="utf-8"
    )


def create_rag_service() -> RAGService:

    # -----------------------------
    # Extraction Model
    # -----------------------------

    ollama_client = OllamaClient()

    system_prompt = load_system_prompt()

    extractor = Extractor(
        ollama_client=ollama_client,
        system_prompt=system_prompt,
    )

    # -----------------------------
    # RAG Router
    # -----------------------------

    router_client = RouterClient()

    rag_router = RAGRouter(
        router_client=router_client,
    )

    # -----------------------------
    # Business Knowledge Retriever
    # -----------------------------

    retriever = BusinessKnowledgeRetriever()

    # -----------------------------
    # RAG Service
    # -----------------------------

    return RAGService(
        router=rag_router,
        retriever=retriever,
        extractor=extractor,
    )


rag_service = create_rag_service()


@app.post(
    "/api/v1/extract",
    response_model=ExtractionResponse,
)
def extract(request: ExtractionRequest):

    result = rag_service.process(
        form_schema=request.form_schema.model_dump(),
        user_input=request.user_input,
        context=request.context.model_dump(),
    )

    return result


@app.post("/api/v1/rules/upload-pdf")
async def upload_rules_pdf(
    form_name: str = Form(...),
    file: UploadFile = File(...),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    contents = await file.read()
    pdf_file = io.BytesIO(contents)

    try:
        reader = PdfReader(pdf_file)
        text_pages = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_pages.append(page_text)
        extracted_text = "\n\n".join(text_pages).strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract PDF text: {str(e)}")

    docs_dir = Path(__file__).resolve().parents[1] / "knowledge" / "documents"
    docs_dir.mkdir(parents=True, exist_ok=True)

    clean_form_name = form_name.strip()
    target_path = docs_dir / f"{clean_form_name}.txt"

    target_path.write_text(extracted_text, encoding="utf-8")

    return {
        "status": "success",
        "fileName": target_path.name,
        "formName": clean_form_name,
        "characterCount": len(extracted_text),
        "pageCount": len(reader.pages),
    }


if __name__ == "__main__":

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )

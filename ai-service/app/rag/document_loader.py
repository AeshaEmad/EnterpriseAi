from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
)


DOCUMENTS_DIR = (
    Path(__file__).resolve().parents[2]
    / "knowledge"
    / "documents"
)


def load_documents() -> list[Document]:

    documents = []

    for file_path in DOCUMENTS_DIR.glob("*.txt"):

        text = file_path.read_text(
            encoding="utf-8"
        )

        documents.append(
            Document(
                page_content=text,
                metadata={
                    "source": file_path.name,
                },
            )
        )

    return documents


def split_documents(
    documents: list[Document],
) -> list[Document]:

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
    )

    return splitter.split_documents(
        documents
    )
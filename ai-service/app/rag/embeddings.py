from langchain_community.embeddings import (
    FastEmbedEmbeddings,
)
from langchain_qdrant import FastEmbedSparse

from app.rag.config import RAGConfig


def get_dense_embeddings():
    return FastEmbedEmbeddings(
        model_name=RAGConfig.DENSE_MODEL
    )


def get_sparse_embeddings():
    return FastEmbedSparse(
        model_name=RAGConfig.SPARSE_MODEL
    )
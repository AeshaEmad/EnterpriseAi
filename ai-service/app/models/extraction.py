from typing import Any

from pydantic import BaseModel, Field


class ExtractedValue(BaseModel):
    value: Any
    confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )


class Clarification(BaseModel):
    field: str
    question: str
    suggestions: list[str] = []


class ExtractionResponse(BaseModel):
    values: dict[str, ExtractedValue]
    missingFields: list[str]
    clarifications: list[Clarification]
    modelName: str

class FormField(BaseModel):
    name: str
    label: str
    type: str
    required: bool
    defaultValue: Any | None = None
    options: list[Any] | None = None
    validation: dict[str, Any] | None = None


class FormSchema(BaseModel):
    formId: str
    formName: str
    versionId: str
    versionNumber: int
    fields: list[FormField]


class ExtractionContext(BaseModel):
    existingValues: dict[str, Any] = {}
    conversation: list[dict[str, Any]] = []


class ExtractionRequest(BaseModel):
    form_schema: FormSchema
    user_input: str
    context: ExtractionContext    
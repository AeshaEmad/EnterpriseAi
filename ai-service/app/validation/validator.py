import json
from pathlib import Path
from typing import Any

SCHEMA_PATH = (
    Path(__file__).resolve().parents[2]
    / "schemas"
    / "auto_fill_output_schema.json"
)


def _matches_type(value: Any, expected_type: str | list[str] | None) -> bool:
    if expected_type is None:
        return True

    if isinstance(expected_type, list):
        return any(_matches_type(value, item_type) for item_type in expected_type)

    if expected_type == "object":
        return isinstance(value, dict)
    if expected_type == "array":
        return isinstance(value, list)
    if expected_type == "string":
        return isinstance(value, str)
    if expected_type == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected_type == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected_type == "boolean":
        return isinstance(value, bool)
    if expected_type == "null":
        return value is None

    return True


def _validate_node(value: Any, schema: dict[str, Any], path: str, errors: list[str]) -> None:
    if not isinstance(schema, dict):
        return

    expected_type = schema.get("type")
    if expected_type is not None and not _matches_type(value, expected_type):
        errors.append(f"{path}: expected type {expected_type}, got {type(value).__name__}")
        return

    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: value not in allowed enum set")

    if "required" in schema and isinstance(value, dict):
        for required_field in schema["required"]:
            if required_field not in value:
                errors.append(f"{path}: missing required property '{required_field}'")

    if isinstance(value, dict):
        properties = schema.get("properties", {})
        required_properties = schema.get("required", [])
        for key in required_properties:
            if key not in value:
                errors.append(f"{path}: missing required property '{key}'")
        for key, child_value in value.items():
            if key in properties:
                _validate_node(child_value, properties[key], f"{path}.{key}", errors)
        if schema.get("additionalProperties") is False:
            allowed_keys = set(properties.keys())
            for key in value.keys():
                if key not in allowed_keys:
                    errors.append(f"{path}: unexpected property '{key}'")

    elif isinstance(value, list):
        item_schema = schema.get("items")
        if item_schema is not None:
            for index, item in enumerate(value):
                _validate_node(item, item_schema, f"{path}[{index}]", errors)

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path}: value below minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{path}: value exceeds maximum {schema['maximum']}")


def validate_json_against_schema(payload: Any, *, schema_path: Path | str | None = None) -> Any:
    schema_file = Path(schema_path) if schema_path is not None else SCHEMA_PATH
    with schema_file.open("r", encoding="utf-8") as stream:
        schema = json.load(stream)

    errors: list[str] = []
    _validate_node(payload, schema, "$", errors)

    if errors:
        raise ValueError("Schema validation failed: " + "; ".join(errors))

    return payload

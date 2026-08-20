# API Contracts — EnterpriseAI

Version: 1.1
Audience: Backend, AI (Ahmed), Frontend team

Base URLs (dev):
- .NET Backend: `https://localhost:7000/api` (see `launchSettings.json`)
- AI Service (FastAPI): `http://localhost:8000`

All JSON. All timestamps are UTC ISO-8601.

---

## Architecture

```
Frontend (React)
   │
   │ POST /api/submissions/{id}/extract
   ▼
.NET Backend
   │
   │ POST http://localhost:8000/api/v1/extract
   ▼
AI Service (FastAPI)
   │
   ▼
Ollama / Qwen3
```

**The frontend communicates only with the .NET Backend.**
**The AI service is not directly exposed to the frontend.**
**The backend fetches FormSchema from the DB and proxies it to the AI service.**

---

## 1. AI Service Contract (Ahmed)

The AI service is called by the **.NET Backend**, not by the frontend.

### POST `/api/v1/extract`

#### Request

```json
{
  "form_schema": {
    "formId": "f-001",
    "formName": "Loan Application",
    "versionId": "fv-001",
    "versionNumber": 1,
    "fields": [
      {
        "name": "fullName",
        "label": "Full Name",
        "type": "text",
        "required": true,
        "defaultValue": null,
        "options": null,
        "validation": { "minLength": 3, "maxLength": 100 }
      },
      {
        "name": "department",
        "label": "Department",
        "type": "select",
        "required": true,
        "options": ["Sales", "HR", "IT", "Finance"]
      },
      {
        "name": "monthlySalary",
        "label": "Monthly Salary (EGP)",
        "type": "number",
        "required": false,
        "options": null,
        "validation": { "min": 0, "max": 1000000 }
      },
      {
        "name": "requestedLoan",
        "label": "Requested Loan Amount (EGP)",
        "type": "number",
        "required": true,
        "options": null,
        "validation": { "min": 0, "max": 10000000 }
      },
      {
        "name": "managerEmail",
        "label": "Manager Email",
        "type": "text",
        "required": true,
        "defaultValue": null,
        "options": null,
        "validation": null
      }
    ]
  },
  "user_input": "Create a loan application for Ahmed in Sales, requesting 350,000 EGP.",
  "context": {
    "existingValues": {
      "clientId": "c-001"
    },
    "conversation": []
  }
}
```

#### Response 200

```json
{
  "values": {
    "fullName": { "value": "Ahmed", "confidence": 0.97 },
    "department": { "value": "Sales", "confidence": 0.99 },
    "requestedLoan": { "value": 350000, "confidence": 0.96 }
  },
  "missingFields": ["managerEmail"],
  "clarifications": [],
  "modelName": "qwen3:4b"
}
```

With ambiguity:

```json
{
  "values": {
    "fullName": { "value": "Ahmed", "confidence": 0.97 }
  },
  "missingFields": ["managerEmail"],
  "clarifications": [
    {
      "field": "employmentType",
      "question": "Is Ahmed full-time or part-time?",
      "suggestions": ["Full-Time", "Part-Time"]
    }
  ],
  "modelName": "qwen3:4b"
}
```

#### Error Responses

| Status | Code | Meaning |
|---|---|---|
| `400` | `INVALID_REQUEST` | Invalid request body or schema |
| `503` | `MODEL_UNAVAILABLE` | AI model is currently unavailable |
| `500` | `AI_SERVICE_ERROR` | Unexpected AI service error |

Error shape:

```json
{
  "error": {
    "code": "MODEL_UNAVAILABLE",
    "message": "The AI model is currently unavailable."
  }
}
```

#### Contract Rules for the AI

| Rule | Source | Behavior |
|---|---|---|
| Strict population (FR-04) | Requirements | Fill ONLY fields explicitly mentioned. Fields not mentioned must be OMITTED from `values`. |
| No hallucination (NFR-04) | Requirements | Never invent values the user did not provide or that are not derivable from provided data. |
| Ambiguity detection (FR-02) | Requirements | If the input is ambiguous, add to `clarifications` array with field name, question, and suggestions. |
| Missing fields (FR-03) | Requirements | Report which `required` fields have no value in `missingFields`. |
| Deterministic (NFR-03) | Requirements | Use deterministic generation settings (temperature=0). Same prompt + schema must produce identical output. |

- The AI NEVER writes to the database. It is stateless: request in, JSON out.
- `confidence`: optional; if included, it is a model confidence score (not a calibrated probability).

---

## 2. .NET Backend Contract (Frontend team)

All endpoints require `Authorization: Bearer <token>` except `POST /api/auth/login`.

### 2.1 Auth

| Method | Route | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | `{ token, expiresAt, user }` |

### 2.2 Users (Admin only)

| Method | Route | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/users` | Admin | — | `UserDto[]` |
| GET | `/api/users/{id}` | Admin | — | `UserDto` |
| POST | `/api/users` | Admin | `CreateUserDto` | `UserDto` |
| PUT | `/api/users/{id}` | Admin | `UpdateUserDto` | `UserDto` |
| DELETE | `/api/users/{id}` | Admin | — | 204 |

`CreateUserDto`:
```json
{
  "fullName": "Ahmed Adel",
  "email": "ahmed@enterpriseai.dev",
  "password": "Ahmed@123",
  "role": "User"
}
```

`UpdateUserDto`:
```json
{
  "fullName": "Ahmed Adel",
  "role": "User",
  "isActive": true
}
```

`UserDto`:
```json
{
  "id": "u-001",
  "fullName": "Ahmed Adel",
  "email": "ahmed@enterpriseai.dev",
  "role": "User",
  "isActive": true,
  "createdAt": "2026-08-17T10:00:00Z",
  "updatedAt": "2026-08-17T10:00:00Z"
}
```

### 2.3 Forms

| Method | Route | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/forms` | User | — | `FormDto[]` |
| GET | `/api/forms/{id}` | User | — | `FormDetailDto` |
| GET | `/api/forms/{id}/schema` | User | — | `FormSchemaDto` |
| POST | `/api/forms` | Admin | `{ name, description }` | `FormDto` |
| POST | `/api/forms/{id}/versions` | Admin | `{ versionNumber, status }` | `FormVersionDto` |
| POST | `/api/forms/{id}/versions/{vid}/fields` | Admin | `CreateFieldDto` | `FormFieldDto` |
| POST | `/api/forms/{id}/versions/{vid}/submit-for-approval` | Admin | — | `FormVersionDto` |
| POST | `/api/forms/{id}/versions/{vid}/approve` | Manager | — | `FormVersionDto` |
| POST | `/api/forms/{id}/versions/{vid}/reject` | Manager | `{ comment? }` | `FormVersionDto` |
| POST | `/api/forms/{id}/versions/{vid}/resubmit` | Admin | — | `FormVersionDto` |

#### Form Version Approval Workflow

```
Draft → PendingApproval → Published (active)
                    ↓
                Rejected → Draft (resubmit)
```

- **Draft**: Admin can modify fields freely.
- **PendingApproval**: Waiting for Manager approval; no changes allowed.
- **Published**: Active version; used by submissions. Previous active version is automatically deactivated.
- **Rejected**: Admin can edit and resubmit.

### 2.4 Business Rules (Admin rule-builder UI)

| Method | Route | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/business-rules` | Admin | `CreateBusinessRuleDto` | `BusinessRuleDto` |
| GET | `/api/business-rules?formId={id}` | User | — | `BusinessRuleDto[]` |
| PUT | `/api/business-rules/{id}` | Admin | `UpdateBusinessRuleDto` | `BusinessRuleDto` |
| DELETE | `/api/business-rules/{id}` | Admin | — | 204 |

`CreateBusinessRuleDto`:

```json
{
  "formId": "f-001",
  "formVersionId": "fv-001",
  "name": "Max Loan Amount",
  "description": "Loan cannot exceed 300,000 EGP",
  "ruleType": "field_value",
  "priority": 10,
  "isActive": true,
  "definition": {
    "field": "requestedLoan",
    "operator": "<=",
    "value": 300000,
    "message": "Requested loan amount exceeds the maximum limit allowed for this customer category."
  }
}
```

`UpdateBusinessRuleDto`:

```json
{
  "name": "Max Loan Amount",
  "description": "Loan cannot exceed 300,000 EGP",
  "ruleType": "field_value",
  "priority": 10,
  "isActive": true,
  "definition": {
    "field": "requestedLoan",
    "operator": "<=",
    "value": 300000,
    "message": "Requested loan amount exceeds the maximum limit allowed for this customer category."
  }
}
```

`BusinessRuleDto`:

```json
{
  "id": "r-001",
  "formVersionId": "fv-001",
  "formId": "f-001",
  "name": "Max Loan Amount",
  "description": "Loan cannot exceed 300,000 EGP",
  "ruleType": "field_value",
  "definition": {
    "field": "requestedLoan",
    "operator": "<=",
    "value": 300000,
    "message": "Requested loan amount exceeds the maximum limit allowed for this customer category."
  },
  "priority": 10,
  "isActive": true,
  "createdAt": "2026-08-17T10:00:00Z",
  "updatedAt": "2026-08-17T10:00:00Z"
}
```

Supported `ruleType` values (v1):
- `field_value` — single field vs a value: `{ field, operator, value, message }`
  - operators: `==`, `!=`, `>`, `>=`, `<`, `<=`, `contains`, `not_contains`, `is_required`
- `cross_field` — consistency between two fields: `{ fields: [a, b], operator, value, message }`
  - v1 operator: `equals` (a must equal b)
- `client_limit` — like `field_value` but the value comes from `UserProfileAttribute` via `{ field, operator, clientField, clientAttribute, message }`

### 2.5 Submissions (the live-fill workflow)

| Method | Route | Body | Returns |
|---|---|---|---|
| POST | `/api/submissions` | `{ formId, initialValues? }` | `SubmissionDto` (Status=`Draft`) |
| GET | `/api/submissions/{id}` | — | `SubmissionDto` with fields |
| POST | `/api/submissions/{id}/extract` | `{ userInput }` | `ExtractResultDto` |
| PUT | `/api/submissions/{id}/fields` | `{ values: [{ name, value, source }] }` | `SubmissionDto` |
| POST | `/api/submissions/{id}/validate` | — | `ValidationResultDto` |
| POST | `/api/submissions/{id}/confirm` | — | `SubmissionDto` (Status=`Confirmed`) |

#### Extract (the core AI integration)

The frontend calls `POST /api/submissions/{id}/extract` with the user's natural-language input.

The backend:
1. Loads the form schema from the database.
2. Sends it + user input to the AI service.
3. Saves `AIAnalysis` and `ConversationMessage` records.
4. Fills submission fields with AI values.
5. Returns `ExtractResultDto`.

```json
{
  "filledFields": [
    { "formFieldId": "ff-1", "name": "fullName", "label": "Full Name", "value": "Ahmed", "source": "ai", "confidenceScore": 0.97, "isConfirmed": false }
  ],
  "missingFields": ["managerEmail"],
  "clarifications": [
    { "field": "employmentType", "question": "Is Ahmed full-time or part-time?", "suggestions": ["Full-Time", "Part-Time"] }
  ],
  "modelName": "qwen3:4b",
  "submissionId": "sub-001"
}
```

#### Submission Status Transitions

```
Draft → AI_Filled (AI populated fields)
Draft → User_Edited (user edited manually)
AI_Filled → User_Edited (user edited after AI)
User_Edited → User_Edited (more edits)
AI_Filled → Validated (validation passed)
User_Edited → Validated (validation passed)
Validated → Confirmed (final submit)
Validated → NeedsCorrection (validation failed)
NeedsCorrection → AI_Filled (AI re-filled after correction)
NeedsCorrection → User_Edited (user corrected manually)
```

Invalid transitions throw `409 INVALID_OPERATION`.

#### Validation Response

```json
{
  "valid": false,
  "fieldErrors": [
    { "field": "department", "message": "'Department' is required." }
  ],
  "ruleResults": [
    {
      "ruleId": "r-001",
      "name": "Max Loan Amount",
      "passed": false,
      "message": "Requested loan amount exceeds the maximum limit allowed for this customer category.",
      "severity": "error"
    }
  ],
  "submissionStatus": "NeedsCorrection"
}
```

---

## 3. Error Response Format

All API errors follow this format:

```json
{
  "error": {
    "code": "BUSINESS_RULE_FAILED",
    "message": "Requested loan amount exceeds the maximum limit.",
    "details": null
  }
}
```

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_OPERATION` | 409 | Business logic violation or invalid state transition |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 4. Status Values

`FormSubmission.Status`: `Draft`, `AI_Filled`, `User_Edited`, `NeedsCorrection`, `Validated`, `Confirmed`.

`FormVersion.Status`: `Draft`, `PendingApproval`, `Published`, `Rejected`.

`SubmissionField.Source`: `ai`, `user`, `admin`, `seed`.

`RuleExecutionResult.Status`: `Passed`, `Failed`, `Error`.

---

## 5. Field Value Types

| FormField.Type | JsonNode Value | Example |
|---|---|---|
| `text` | `string` | `"Ahmed"` |
| `number` | `decimal` | `350000` |
| `boolean` | `bool` | `true` |
| `select` | `string` (one of Options) | `"Sales"` |
| `multiselect` | `string[]` | `["Sales", "HR"]` |
| `date` | `string` (ISO 8601) | `"2026-08-17"` |

---

## 6. Open Items

1. Client records source for `client_limit` rules — to be agreed with the domain owner.
2. Conversation history for multi-turn AI — supported in contract but optional for V1.
3. AI service authentication — API key via `X-AI-Service-Key` header (optional for V1).

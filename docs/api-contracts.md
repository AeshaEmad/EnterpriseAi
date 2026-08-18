# API Contracts — EnterpriseAI

Version: 1.0 (draft)
Audience: Backend, AI (Ahmed), Frontend team

Base URLs (dev):
- .NET Backend: `https://localhost:7000/api` (see `launchSettings.json`)
- AI Service (FastAPI): `http://localhost:8000`

All JSON. All timestamps are UTC ISO-8601.

---

## 1. AI Service Contract (Ahmed)

### POST `/extract`

The frontend sends the **form schema** (from `GET /api/forms/{id}/schema`) plus the user's
natural-language input. The service returns a structured JSON the frontend uses to fill the form.

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
      }
    ]
  },
  "user_input": "Create a loan application for Ahmed in Sales, requesting 350,000 EGP.",
  "context": {
    "existingValues": { "clientId": "c-001" }
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
  "missingFields": ["managerEmail", "collateralType"],
  "ambiguousFields": [
    {
      "name": "employmentType",
      "question": "Is Ahmed full-time or part-time?",
      "suggestions": ["Full-Time", "Part-Time"]
    }
  ],
  "clarification": "Is Ahmed an employee or an external contractor?",
  "modelName": "qwen3:4b"
}
```

#### Contract rules for the AI

| Rule | Source | Behavior |
|---|---|---|
| Strict population (FR-04) | Requirements | Fill ONLY fields explicitly mentioned. Fields not mentioned must be OMITTED from `values`. |
| No hallucination (NFR-04) | Requirements | Never invent values the user did not provide or that are not derivable from provided data. |
| Ambiguity detection (FR-02) | Requirements | If the input is ambiguous, put the field in `ambiguousFields` with a question, and set `clarification`. |
| Deterministic (NFR-03) | Requirements | The same prompt + schema must produce the same output. |
| Missing fields (FR-03) | Requirements | Report which `required` fields have no value in `missingFields`. |

- `confidence`: 0.0–1.0, how sure the model is about the value.
- The AI NEVER writes to the database. It is stateless: request in, JSON out.

---

## 2. .NET Backend Contract (Frontend team)

All endpoints require `Authorization: Bearer <token>` except `POST /api/auth/login`.

### 2.1 Auth (done)

| Method | Route | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | `{ token, expiresAt, user }` |

### 2.2 Forms

| Method | Route | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/forms` | User | — | `FormDto[]` |
| GET | `/api/forms/{id}` | User | — | `FormDetailDto` |
| GET | `/api/forms/{id}/schema` | User | — | `FormSchemaDto` (this exact JSON feeds `/extract`) |
| POST | `/api/forms` | Admin | `{ name, description }` | `FormDto` |
| POST | `/api/forms/{id}/versions` | Admin | `{ versionNumber, status }` | `FormVersionDto` |
| POST | `/api/forms/{id}/versions/{versionId}/fields` | Admin | `CreateFieldDto` | `FormFieldDto` |

`FormSchemaDto` = exactly the `form_schema` object from section 1 (formId, formName,
versionId, versionNumber, fields[]).

### 2.3 Business Rules (Admin rule-builder UI)

| Method | Route | Body | Returns |
|---|---|---|---|
| POST | `/api/business-rules` | `CreateBusinessRuleDto` | `BusinessRuleDto` |
| GET | `/api/business-rules?formId={id}` | — | `BusinessRuleDto[]` |
| PUT | `/api/business-rules/{id}` | `UpdateBusinessRuleDto` | `BusinessRuleDto` |
| DELETE | `/api/business-rules/{id}` | — | 204 |

`CreateBusinessRuleDto`:

```json
{
  "formId": "f-001",
  "name": "Max Loan Amount",
  "description": "Loan cannot exceed 300,000 EGP",
  "ruleType": "field_value",
  "priority": 10,
  "definition": {
    "field": "requestedLoan",
    "operator": "<=",
    "value": 300000,
    "message": "Requested loan amount exceeds the maximum limit allowed for this customer category."
  }
}
```

Supported `ruleType` values (v1):
- `field_value` — single field vs a value: `{ field, operator, value, message }`
  - operators: `==`, `!=`, `>`, `>=`, `<`, `<=`, `contains`, `not_contains`, `is_required`
- `cross_field` — consistency between two fields: `{ fields: [a, b], operator, value, message }`
  - v1 operator: `equals` (a must equal b)
- `client_limit` — like `field_value` but the value comes from the client record (credit limit example)

`message` is returned verbatim to the UI when the rule fails (FR-09: display violated rule + reason).

### 2.4 Submissions (the live-fill workflow)

| Method | Route | Body | Returns |
|---|---|---|---|
| POST | `/api/submissions` | `{ formId, initialValues? }` | `SubmissionDto` (draft, Status=`Draft`) |
| GET | `/api/submissions/{id}` | — | `SubmissionDto` with fields |
| PUT | `/api/submissions/{id}/fields` | `{ values: [{ name, value, source }] }` | `SubmissionDto` |
| POST | `/api/submissions/{id}/validate` | — | `ValidationResultDto` |
| POST | `/api/submissions/{id}/confirm` | — | `SubmissionDto` (Status=`Confirmed`) |

`PUT .../fields` upserts fields by `name` and records every change in
`SubmissionFieldHistory` (who/when/old/new).

`POST .../validate` runs:
1. Field-level validation from `FormField.ValidationRules` (server-side, FR-03)
2. All active business rules for the form version (FR-09)
3. Cross-field consistency (FR-10)

```json
{
  "valid": false,
  "fieldErrors": [
    { "field": "department", "message": "This field is required." }
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

Workflow (matches requirements):
- Validate fails → status `NeedsCorrection`, form stays editable, frontend shows errors.
- Validate passes AND confirm → status `Confirmed`, a `Confirmations` row is stored.
- Only `Confirmed` submissions count as completed (NFR-06). Rejected/drafts are not "accepted history".

---

## 3. Status values

`FormSubmission.Status`: `Draft`, `AI_Filled`, `User_Edited`, `NeedsCorrection`, `Validated`, `Confirmed`.

`SubmissionField.Source`: `ai`, `user`, `admin`, `seed`.

`RuleExecutionResult.Status`: `Passed`, `Failed`, `Error`.

---

## 4. Open items for the team

1. Confirm `/extract` response shape (especially `ambiguousFields` + `clarification`) with Ahmed.
2. Decide whether the frontend calls `/extract` directly or the .NET backend proxies it.
3. Client records source for `client_limit` rules — to be agreed with the domain owner.

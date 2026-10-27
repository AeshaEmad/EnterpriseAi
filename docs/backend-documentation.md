# Enterprise AI Backend — Full Documentation

Last updated: 2026-10-27

---

## 1. Project Overview

Enterprise AI Auto-Filler: a .NET Core 10 Web API backend for an AI-driven form auto-fill and validation system. The backend manages users, forms, business rules, submissions, and enforces server-side validation before submission.

### Tech Stack
- ASP.NET Core 10 (Web API)
- Entity Framework Core (SQL Server)
- JWT Authentication (Bearer tokens)
- Generic Repository Pattern
- Scalar API Reference (dev UI)

---

## 2. Roles & Users

| Role | Permissions |
|---|---|
| `Admin` | CRUD forms, versions, fields; submit versions for approval; manage user access; upload PDF rules |
| `Manager` | Approve/reject form versions |
| `User` | View accessible forms, create/update/validate/confirm submissions |

### Default Users (seeded on startup)

| Role | Email | Password |
|---|---|---|
| Admin | admin@enterpriseai.dev | Admin@123 |
| Manager | manager@enterpriseai.dev | Manager@123 |

> Credentials are configurable via `appsettings.json` under `Admin` and `Manager` sections.

---

## 3. Form Approval Workflow

Versions go through a status lifecycle before becoming active:

```
Draft -> PendingApproval -> Published (active)
                    |
                Rejected -> Draft (resubmit)
```

- **Draft**: Admin can modify fields freely.
- **PendingApproval**: Waiting for Manager approval; no changes allowed.
- **Published**: Active version; used by all submissions. Previous active version is automatically deactivated.
- **Rejected**: Rejected by Manager; Admin can edit and resubmit.

### Approval Endpoints

```
POST /api/forms/{id}/versions/{versionId}/submit-for-approval   [Admin]
POST /api/forms/{id}/versions/{versionId}/approve               [Manager]
POST /api/forms/{id}/versions/{versionId}/reject                [Manager]  Body: { "notes": "..." }
POST /api/forms/{id}/versions/{versionId}/resubmit              [Admin]
```

---

## 4. API Endpoints

All endpoints require `Authorization: Bearer <token>` unless noted.

### 4.1 Auth

```
POST   /api/auth/login              { email, password } -> { token, expiresAt, user }
```

### 4.2 Users (Admin only)

```
GET    /api/users                   -> UserDto[]
GET    /api/users/{id}              -> UserDto
POST   /api/users                   -> UserDto    Body: CreateUserDto
```

### 4.3 Forms

```
GET    /api/forms                                              -> FormDto[]        (filtered by role/access)
GET    /api/forms/{id}                                         -> FormDetailDto
GET    /api/forms/{id}/schema                                  -> FormSchemaDto    (feeds AI /extract)
POST   /api/forms                               [Admin]        -> FormDto
POST   /api/forms/{id}/versions                 [Admin]        -> FormVersionDto
POST   /api/forms/{id}/versions/{vid}/fields    [Admin]        -> FormFieldDto
POST   /api/forms/{id}/versions/{vid}/submit-for-approval [Admin] -> FormVersionDto
POST   /api/forms/{id}/versions/{vid}/approve   [Manager]      -> FormVersionDto
POST   /api/forms/{id}/versions/{vid}/reject    [Manager]      -> FormVersionDto
POST   /api/forms/{id}/versions/{vid}/resubmit  [Admin]        -> FormVersionDto
```

> **Access Filtering**: `GET /api/forms` and `GET /api/forms/{id}` return results based on user role:
> - Admin/Manager: all forms.
> - Regular User: only forms they have been granted access to via `UserFormAccess`.

### 4.4 Form Access Management (Admin only)

```
GET    /api/users/{userId}/forms                -> UserFormAccessDto[]
POST   /api/users/{userId}/forms                -> UserFormAccessDto    Body: { "formId": "..." }
DELETE /api/users/{userId}/forms                -> 204 No Content       Body: { "formId": "..." }
```

### 4.5 Business Rules (Admin only for write operations)

```
GET    /api/business-rules?formId={id}                          -> BusinessRuleDto[]
POST   /api/business-rules                      [Admin]         -> BusinessRuleDto
PUT    /api/business-rules/{id}                 [Admin]         -> BusinessRuleDto
DELETE /api/business-rules/{id}                 [Admin]         -> 204
POST   /api/business-rules/upload-pdf           [Admin]         -> { message, fileName, formName, uploadedAt }
```

**`upload-pdf` Request**: `multipart/form-data` with fields:
- `file` - PDF file containing business rules
- `formId` - target form ID
- `formName` - target form name (used by AI service for indexing)

**RuleDefinition JSON shapes:**
- `field_value`: `{ "field": "requestedLoan", "operator": "<=", "value": 300000, "message": "..." }`
- `cross_field`: `{ "fields": ["dateOfBirth", "employmentType"], "operator": "equals", "message": "..." }`
- `client_limit`: `{ "field": "loanAmount", "operator": "<=", "clientField": "clientId", "clientAttribute": "creditLimit", "message": "..." }`

Supported operators: `==`, `!=`, `>`, `>=`, `<`, `<=`, `contains`, `not_contains`, `is_required`

### 4.6 Submissions

```
POST   /api/submissions                                         -> SubmissionDto    Body: CreateSubmissionDto
GET    /api/submissions/{id}                                    -> SubmissionDto
PUT    /api/submissions/{id}/fields                             -> SubmissionDto    Body: UpdateSubmissionFieldsDto
POST   /api/submissions/{id}/extract                            -> ExtractResultDto  Body: { "userInput": "..." }
POST   /api/submissions/{id}/validate                           -> ValidationResultDto
POST   /api/submissions/{id}/confirm                            -> SubmissionDto
```

---

## 5. AI Integration

### 5.1 AiServiceClient

`AiServiceClient.cs` - bridges the backend to AI capabilities. Supports two modes selected automatically at runtime:

| Mode | Condition | Target |
|---|---|---|
| **Cloud LLM** | `AiService:ApiKey` is set | Groq API (or compatible OpenAI endpoint) at `/chat/completions` |
| **Microservice** | No API key configured | Local Python AI service at `AiService:BaseUrl` |

### 5.2 Extract Flow

`POST /api/submissions/{id}/extract` -> `SubmissionService.ExtractAsync()` -> `AiServiceClient.ExtractAsync()`:

1. Backend builds an `AiExtractRequest` with the form schema and user free-text input.
2. AI returns extracted field values, missing fields, and clarification questions.
3. `SubmissionService` applies extracted values to `SubmissionFields`, records an `AIAnalysis`, and transitions the submission to `AI_Filled`.

### 5.3 PDF Business Rules Upload

`POST /api/business-rules/upload-pdf` -> `AiServiceClient.UploadBusinessRulePdfAsync()`:

- Forwards the PDF to the AI service at `/api/v1/rules/upload-pdf` via `multipart/form-data`.
- The AI service indexes the PDF for context-aware rule suggestions.

### 5.4 AI Service Configuration (`appsettings.json`)

```json
"AiService": {
  "BaseUrl": "http://127.0.0.1:8001",
  "ExtractEndpoint": "/api/v1/extract",
  "ApiKey": "",
  "Model": "qwen2.5-coder:7b-instruct-q3_K_M",
  "TimeoutSeconds": 180
}
```

---

## 6. Business Rule Engine

`BusinessRuleEngine.cs` - the core of Module C.

Executes rules against a submission's field values:
- **field_value**: Compares a field against a literal value.
- **cross_field**: Checks consistency between two fields (e.g., dates, employment types).
- **client_limit**: Resolves a threshold from `UserProfileAttribute` records (e.g., client credit limit).

Each rule execution produces a `RuleExecutionResult` with status `Passed`, `Failed`, or `Error`.

---

## 7. Field-Level Validation

`SubmissionService.ValidateFields()` runs before rule execution:
- Checks `IsRequired` fields have a value.
- Applies `ValidationRules` JSON from `FormField`: `minLength`, `maxLength`, `min`, `max`.

---

## 8. Submission Lifecycle

```
Draft -> AI_Filled -> User_Edited -> NeedsCorrection -> Validated -> Confirmed
```

| Status | Description |
|---|---|
| `Draft` | Just created; no values yet. |
| `AI_Filled` | Fields populated by AI via `/extract`. |
| `User_Edited` | User manually edited at least one field. |
| `NeedsCorrection` | Validation or business rules failed. |
| `Validated` | Passed all checks; ready for confirmation. |
| `Confirmed` | Final submission stored in history. |

**State machine**: Invalid transitions throw `InvalidOperationException` (mapped to 409 Conflict).

---

## 9. User Form Access (Access Control)

`UserFormAccess` entity controls which regular users can view and submit forms.

- Only **Admin** can grant/revoke access.
- Admins and Managers always see all forms.
- Regular users only see forms in their `UserFormAccess` list.
- Duplicate grants throw `InvalidOperationException` (409).

---

## 10. Code Structure

```
EnterpriseAI/
├── Controllers/          -> HTTP layer
│   ├── AuthController.cs
│   ├── UsersController.cs          (Admin: CRUD users)
│   ├── FormsController.cs          (Forms + versions + approval workflow)
│   ├── FormAccessController.cs     (Admin: grant/revoke user->form access)
│   ├── BusinessRulesController.cs  (Rules CRUD + PDF upload)
│   └── SubmissionsController.cs    (Submissions + AI extract)
├── DTOs/                 -> Request/response objects
│   ├── Auth/
│   ├── Users/
│   ├── Forms/
│   ├── FormAccess/
│   ├── BusinessRules/
│   ├── Submissions/
│   └── Common/
├── Data/
│   ├── AppDbContext.cs   -> EF Core context + all DbSets + relationships
│   └── DbInitializer.cs  -> Seeds Admin + Manager users + demo form
├── Extensions/
│   └── ServiceCollectionExtensions.cs  -> DI registration + JWT + AI client config
├── Mappings/             -> Entity <-> DTO mapping
├── Middleware/
│   └── ExceptionHandlingMiddleware.cs  -> Global error handling
├── Models/               -> 15 EF Core entities
├── Repositories/
│   ├── Interfaces/       -> IReadRepository<T>, IWriteRepository<T>, IRepository<T>
│   └── Repository.cs     -> Generic implementation
├── Services/
│   ├── Interfaces/       -> IAuthService, IUserService, IFormService, IFormAccessService,
│   │                         IBusinessRuleService, ISubmissionService,
│   │                         IBusinessRuleEngine, IAiServiceClient
│   └── Implementations/  -> AuthService, UserService, FormService, FormAccessService,
│                             BusinessRuleService, SubmissionService,
│                             BusinessRuleEngine, AiServiceClient, AiPrompts
├── Settings/
│   └── JwtSettings.cs    -> JWT configuration model
└── Program.cs            -> App setup + middleware pipeline
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Generic Repository | Decouples services from EF Core; supports testing |
| ExceptionHandlingMiddleware | Global error-to-HTTP mapping without try/catch in controllers |
| JSON conversion in DB | `JsonNode` <-> `string` via EF Core value converter; enables flexible rule/field schemas |
| Business Rule Engine as separate service | Single responsibility; isolated for testing |
| Form approval workflow | Prevents accidental changes to live forms; audit trail via status transitions |
| Dual AI mode (Cloud LLM / Microservice) | Flexible deployment; use cloud key for production, local Ollama for dev |
| UserFormAccess table | Row-level form access control for regular users without complex permission frameworks |

---

## 11. Database Tables (15)

| # | Table | Purpose |
|---|---|---|
| 1 | Users | Accounts with roles |
| 2 | UserProfileAttributes | Client-specific key-value attributes (e.g., creditLimit) |
| 3 | Forms | Form definitions |
| 4 | FormVersions | Versioned snapshots of a form (Draft/PendingApproval/Published/Rejected) |
| 5 | FormFields | Individual fields within a version |
| 6 | FormSubmissions | User submission instances |
| 7 | SubmissionFields | Per-field values within a submission |
| 8 | SubmissionFieldHistory | Audit trail of field value changes |
| 9 | AIAnalyses | Records of AI extraction calls |
| 10 | ConversationMessages | Chat history for multi-turn AI clarification |
| 11 | Clarifications | AI-generated clarification questions per field |
| 12 | BusinessRules | Rule definitions linked to a form version |
| 13 | RuleExecutionResults | Outcomes of rule checks per submission |
| 14 | Confirmations | Final confirmation records |
| 15 | UserFormAccesses | Grants regular users access to specific forms |

---

## 12. Error Handling

`ExceptionHandlingMiddleware` maps exceptions to HTTP status codes:

| Exception | HTTP Status |
|---|---|
| `UnauthorizedAccessException` | 401 |
| `InvalidOperationException` | 409 Conflict |
| `KeyNotFoundException` | 404 |
| Unhandled | 500 |

---

## 13. CORS Configuration

Allowed origins (configurable in `appsettings.json` under `Cors:AllowedOrigins`):
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://enterpriseaifront.runasp.net`
- `https://enterpriseaifront.runasp.net`

---

## 14. API Contracts (Team Integration)

Full contract for AI <-> Backend <-> Frontend integration is in:
`docs/api-contracts.md`

Scalar interactive API docs available in development at:
`/scalar/v1` (after running the backend locally)

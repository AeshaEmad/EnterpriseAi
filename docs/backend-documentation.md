# Enterprise AI Backend — Full Documentation

Last updated: 2026-08-17

---

## 1. Project Overview

Enterprise AI Auto-Filler: a .NET Core 10 Web API backend for an AI-driven form auto-fill and validation system. The backend manages users, forms, business rules, submissions, and enforces server-side validation before submission.

### Tech Stack
- ASP.NET Core 10 (Web API)
- Entity Framework Core (SQL Server)
- JWT Authentication
- Generic Repository Pattern

---

## 2. Roles & Users

| Role | Permissions |
|---|---|
| `Admin` | CRUD forms, versions, fields; submit versions for approval |
| `Manager` | Approve/reject form versions |
| `User` | View forms, create/update/validate/confirm submissions |

### Default Users (seeded on startup)

| Role | Email | Password |
|---|---|---|
| Admin | admin@enterpriseai.dev | Admin@123 |
| Manager | manager@enterpriseai.dev | Manager@123 |

---

## 3. Form Approval Workflow

Versions go through a status lifecycle before becoming active:

```
Draft → PendingApproval → Published (active)
                    ↓
                Rejected → Draft (resubmit)
```

- **Draft**: Admin can modify fields freely.
- **PendingApproval**: Waiting for Manager approval; no changes allowed.
- **Published**: Active version; used by all submissions. Previous active version is automatically deactivated.
- **Rejected**: Rejected by Manager; Admin can edit and resubmit.

### Approval Endpoints

```
POST /api/forms/{id}/versions/{versionId}/submit-for-approval   [Admin]
POST /api/forms/{id}/versions/{versionId}/approve               [Manager]
POST /api/forms/{id}/versions/{versionId}/reject                [Manager]
POST /api/forms/{id}/versions/{versionId}/resubmit              [Admin]
```

---

## 4. API Endpoints

All endpoints require `Authorization: Bearer <token>` unless noted.

### 4.1 Auth

```
POST   /api/auth/login              { email, password } → { token, expiresAt, user }
```

### 4.2 Forms

```
GET    /api/forms                                             → FormDto[]
GET    /api/forms/{id}                                        → FormDetailDto
GET    /api/forms/{id}/schema                                 → FormSchemaDto (feeds AI /extract)
POST   /api/forms                                  [Admin]    → FormDto
POST   /api/forms/{id}/versions                    [Admin]    → FormVersionDto
POST   /api/forms/{id}/versions/{vid}/fields       [Admin]    → FormFieldDto
POST   /api/forms/{id}/versions/{vid}/submit-for-approval [Admin]  → FormVersionDto
POST   /api/forms/{id}/versions/{vid}/approve       [Manager] → FormVersionDto
POST   /api/forms/{id}/versions/{vid}/reject        [Manager] → FormVersionDto
POST   /api/forms/{id}/versions/{vid}/resubmit      [Admin]   → FormVersionDto
```

### 4.3 Business Rules (Admin)

```
GET    /api/business-rules?formId={id}                       → BusinessRuleDto[]
POST   /api/business-rules                                   → BusinessRuleDto
PUT    /api/business-rules/{id}                              → BusinessRuleDto
DELETE /api/business-rules/{id}                              → 204
```

**RuleDefinition JSON shapes:**
- `field_value`: `{ "field": "requestedLoan", "operator": "<=", "value": 300000, "message": "..." }`
- `cross_field`: `{ "fields": ["dateOfBirth", "employmentType"], "operator": "equals", "message": "..." }`
- `client_limit`: `{ "field": "loanAmount", "operator": "<=", "clientField": "clientId", "clientAttribute": "creditLimit", "message": "..." }`

Supported operators: `==`, `!=`, `>`, `>=`, `<`, `<=`, `contains`, `not_contains`, `is_required`

### 4.4 Submissions

```
POST   /api/submissions                                      → SubmissionDto
GET    /api/submissions/{id}                                 → SubmissionDto
PUT    /api/submissions/{id}/fields                          → SubmissionDto
POST   /api/submissions/{id}/validate                        → ValidationResultDto
POST   /api/submissions/{id}/confirm                         → SubmissionDto
```

---

## 5. Business Rule Engine

`BusinessRuleEngine.cs` — the core of Module C.

Executes rules against a submission's field values:
- **field_value**: Compares a field against a literal value.
- **cross_field**: Checks consistency between two fields (e.g., dates, employment types).
- **client_limit**: Resolves a threshold from `UserProfileAttribute` records (e.g., client credit limit).

Each rule execution produces a `RuleExecutionResult` with status `Passed`, `Failed`, or `Error`.

---

## 6. Field-Level Validation

`SubmissionService.ValidateFields()` runs before rule execution:
- Checks `IsRequired` fields have a value.
- Applies `ValidationRules` JSON from `FormField`: `minLength`, `maxLength`, `min`, `max`.

---

## 7. Submission Lifecycle

```
Draft → AI_Filled → User_Edited → NeedsCorrection → Validated → Confirmed
```

- **Draft**: Just created; no values yet.
- **AI_Filled**: Fields populated by AI (`source = "ai"`).
- **User_Edited**: User manually edited at least one field.
- **NeedsCorrection**: Validation or business rules failed.
- **Validated**: Passed all checks; ready for confirmation.
- **Confirmed**: Final submission stored in history.

---

## 8. Code Structure

```
EnterpriseAI/
├── Controllers/          → HTTP layer (Auth, Users, Forms, BusinessRules, Submissions)
├── DTOs/                 → Request/response objects (Auth, Users, Forms, BusinessRules, Submissions)
├── Data/
│   ├── AppDbContext.cs   → EF Core context + all DbSets + relationships
│   └── DbInitializer.cs  → Seeds Admin + Manager users
├── Extensions/
│   └── ServiceCollectionExtensions.cs  → DI registration + JWT config
├── Mappings/             → Entity ↔ DTO mapping (User, Form, BusinessRule, Submission)
├── Middleware/
│   └── ExceptionHandlingMiddleware.cs  → Global error handling
├── Models/               → 14 EF Core entities
├── Repositories/
│   ├── Interfaces/       → IReadRepository<T>, IWriteRepository<T>, IRepository<T>
│   └── Repository.cs     → Generic implementation
├── Services/
│   ├── Interfaces/       → IAuthService, IUserService, IFormService, IBusinessRuleService,
│   │                         ISubmissionService, IBusinessRuleEngine
│   └── Implementations/  → AuthService, UserService, FormService, BusinessRuleService,
│                             SubmissionService, BusinessRuleEngine
├── Settings/
│   └── JwtSettings.cs    → JWT configuration model
└── Program.cs            → App setup + middleware pipeline
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Generic Repository | Decouples services from EF Core; supports testing |
| ExceptionHandlingMiddleware | Global error-to-HTTP mapping without try/catch in controllers |
| JSON conversion in DB | `JsonNode` ↔ `string` via EF Core value converter; enables flexible rule/field schemas |
| Business Rule Engine as separate service | Single responsibility; isolated for testing |
| Form approval workflow | Prevents accidental changes to live forms; audit trail via status transitions |

---

## 9. Database Tables (14)

1. Users
2. UserProfileAttributes (client records)
3. Forms
4. FormVersions
5. FormFields
6. FormSubmissions
7. SubmissionFields
8. SubmissionFieldHistory
9. AIAnalyses
10. ConversationMessages
11. Clarifications
12. BusinessRules
13. RuleExecutionResults
14. Confirmations

---

## 10. Error Handling

`ExceptionHandlingMiddleware` maps exceptions to HTTP status codes:

| Exception | HTTP Status |
|---|---|
| `UnauthorizedAccessException` | 401 |
| `InvalidOperationException` | 409 Conflict |
| `KeyNotFoundException` | 404 |
| Unhandled | 500 |

---

## 11. API Contracts (Team Integration)

Full contract for AI ↔ Backend ↔ Frontend integration is in:
`docs/api-contracts.md`

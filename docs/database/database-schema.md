DB Schema 


1. Organizations

	- Id : string PK
	- Name : string
	- Industry : string
	- IsActive : boolean
	- Description : string
	- CreatedAt : timestamp
	- UpdatedAt : timestamp

2. users 

	- Id : string PK
	- FullName : string
	- Email : string
	- PasswordHash : string
	- Role : string
	- IsActive : boolean
	- CreatedAt : timestamp
	- UpdatedAt : timestamp
	- OrganizationId : string FK
	- UNIQUE(OrganizationId, Email)

3. User_profile_attributes

	- Id : string PK
	- AttributeKey : string
	- Value : json
	- DataType : string
	- Source : string
	- UpdatedAt : timestamp
	- CreatedAt : timestamp
	- UserId : string FK
	- UNIQUE(UserId, AttributeKey)

4. forms 

	- Id : string PK
	- OrganizationId : string FK
	- Name : string
	- Description : string
	- IsActive : boolean
	- CreatedAt : timestamp
	- UpdatedAt : timestamp

5. form_versions 

	- Id : string PK
	- FormId : string FK
	- VersionNumber : int
	- Status : string
	- IsActive : boolean
	- CreatedAt : timestamp
	- PublishedAt : timestamp
	- UpdatedAt : timestamp
	- UNIQUE(FormId, VersionNumber)

6. form_fields 

	- Id : string PK
	- FormVersionId : string FK
	- FieldName : string
	- FieldLabel : string
	- FieldType : string
	- IsRequired : boolean
	- DefaultValue : string
	- Options : json
	- ValidationRules : json
	- DisplayOrder : int
	- CreatedAt : timestamp
	- UpdatedAt : timestamp
	- UNIQUE(FormVersionId, FieldName)

7. form_submissions 

	- Id : string PK
	- UserId : string FK
	- OrganizationId : string
	- Status : string
	- CreatedAt : timestamp
	- UpdatedAt : timestamp
	- SubmittedAt : timestamp
	- FormVersionId : string FK

8. submission_fields 

	- Id : string PK
	- ConfirmedByUserId : string FK nullable
	- Value : json
	- Source : string
	- ConfidenceScore : float
	- IsConfirmed : boolean
	- CreatedAt : timestamp
	- UpdatedAt : timestamp
	- ConfirmedAt : timestamp nullable
	- SubmissionId : string FK
	- FormFieldId : string FK
	- UNIQUE(SubmissionId, FormFieldId)

9. ai_analyses 

	- Id : string PK
	- SubmissionId : string FK
	- ModelName : string
	- Status : string
	- AnalysisResult : json
	- MissingFields : json
	- AmbiguousFields : json
	- CreatedAt : timestamp
	- ModelVersion : string
	- PromptVersion : string
	- InferenceTimeMs : int
	- ErrorMessage : string nullable

10. clarifications 

	- Id : string PK
	- SubmissionId : string FK
	- FormFieldId : string FK nullable
	- Question : string
	- Reason : string
	- UserAnswer : string
	- Status : string
	- CreatedAt : timestamp
	- AnsweredAt : timestamp
	- QuestionMessageId : string FK
	- AnswerMessageId : string FK nullable

11. conversation_messages 

	- Id : string PK
	- SubmissionId : string FK
	- Role : string
	- MessageType : string
	- Content : string
	- SequenceNumber : int
	- Metadata : json nullable
	- CreatedAt : timestamp
	- UNIQUE(SubmissionId, SequenceNumber)

12. business_rules 

	- Id : string PK
	- OrganizationId : string FK
	- FormId : string FK nullable
	- RuleType : string
	- Definition : json
	- Priority : int
	- IsActive : boolean
	- CreatedAt : timestamp
	- UpdatedAt : timestamp

13. confirmations 

	- Id : string PK
	- ConfirmedAt : timestamp
	- Status : string
	- SnapshotVersion : int
	- CreatedAt : timestamp
	- ConfirmedByUserId : string FK
	- SubmissionId : string FK


Relations 

organizations
 ├── users
 ├── forms
 ├── form_submissions
 └── business_rules

users
 ├── user_profile_attributes
 └── form_submissions

forms
 ├── form_versions
 └── business_rules

form_versions
 ├── form_fields
 └── form_submissions

form_submissions
 ├── submission_fields
 ├── ai_analyses
 ├── clarifications
 ├── conversation_messages
 └── confirmations

form_fields
 ├── submission_fields
 └── clarifications

conversation_messages
 └── clarifications







					DB Schema

1. Users

	- Id : string PK
	- FullName : string
	- Email : string
	- PasswordHash : string
	- Role : string
	- IsActive : boolean
	- CreatedAt : timestamp
	- UpdatedAt : timestamp
	- UNIQUE(Email)

2.user_profile_attributes

	- Id : string PK
	- AttributeKey : string
	- Value : json
	- DataType : string
	- Source : string
	- CreatedAt : timestamp
	- UpdatedAt : timestamp
	- UserId : string FK
	- UNIQUE(UserId, AttributeKey)

3.Forms

	- Id : string PK
	- Name : string
	- Description : string
	- IsActive : boolean
	- CreatedAt : timestamp
	- UpdatedAt : timestamp

4.form_versions

	- Id : string PK
	- FormId : string FK
	- VersionNumber : int
	- Status : string
	- IsActive : boolean
	- CreatedAt : timestamp
	- PublishedAt : timestamp nullable
	- UpdatedAt : timestamp
	- UNIQUE(FormId, VersionNumber)

5.form_fields

	- Id : string PK
	- FormVersionId : string FK
	- FieldName : string
	- FieldLabel : string
	- FieldType : string
	- IsRequired : boolean
	- DefaultValue : string nullable
	- Options : json nullable
	- ValidationRules : json nullable
	- DisplayOrder : int
	- CreatedAt : timestamp
	- UpdatedAt : timestamp
	- UNIQUE(FormVersionId, FieldName)

6.form_submissions

	- Id : string PK
	- UserId : string FK
	- FormVersionId : string FK
	- Status : string
	- CreatedAt : timestamp
	- UpdatedAt : timestamp
	- SubmittedAt : timestamp nullable

7.submission_fields

	- Id : string PK
	- SubmissionId : string FK
	- FormFieldId : string FK
	- Value : json
	- Source : string
	- ConfidenceScore : float nullable
	- IsConfirmed : boolean
	- ConfirmedByUserId : string FK nullable
	- ConfirmedAt : timestamp nullable
	- CreatedAt : timestamp
	- UpdatedAt : timestamp
	- UNIQUE(SubmissionId, FormFieldId)

8.submission_field_history

	- Id : string PK
	- SubmissionFieldId : string FK
	- OldValue : json nullable
	- NewValue : json
	- Source : string
	- ChangedByUserId : string FK nullable
	- Reason : string nullable
	- ChangedAt : timestamp

9.ai_analyses

	- Id : string PK
	- SubmissionId : string FK
	- ModelName : string
	- Status : string
	- AnalysisResult : json
	- MissingFields : json nullable
	- AmbiguousFields : json nullable
	- ErrorMessage : string nullable
	- CreatedAt : timestamp

10.conversation_messages

	- Id : string PK
	- SubmissionId : string FK
	- Role : string
	- MessageType : string
	- Content : string
	- SequenceNumber : int
	- Metadata : json nullable
	- CreatedAt : timestamp
	- UNIQUE(SubmissionId, SequenceNumber)

11.clarifications

	- Id : string PK
	- SubmissionId : string FK
	- FormFieldId : string FK nullable
	- Question : string
	- Reason : string
	- UserAnswer : string nullable
	- Status : string
	- CreatedAt : timestamp
	- AnsweredAt : timestamp nullable
	- QuestionMessageId : string FK
	- AnswerMessageId : string FK nullable

12.business_rules

	- Id : string PK
	- FormVersionId : string FK nullable
	- Name : string
	- Description : string
	- RuleType : string
	- Definition : json
	- Priority : int
	- IsActive : boolean
	- CreatedAt : timestamp
	- UpdatedAt : timestamp

13.rule_execution_results

	- Id : string PK
	- SubmissionId : string FK
	- BusinessRuleId : string FK
	- Status : string
	- Result : json
	- Details : string nullable
	- ExecutedAt : timestamp

14.confirmations

	- Id : string PK
	- SubmissionId : string FK
	- ConfirmedByUserId : string FK
	- Status : string
	- ConfirmedAt : timestamp
	- CreatedAt : timestamp


			Relations 

user_profile_attributes.UserId > users.Id

form_versions.FormId > forms.Id
form_fields.FormVersionId > form_versions .Id

form_submissions.UserId > users .Id
form_submissions.FormVersionId > form_versions.Id
submission_fields.SubmissionId > form_submissions.Id
submission_fields.FormFieldId > form_fields.Id

submission_fields.ConfirmedByUserId > users.Id

submission_field_history.SubmissionFieldId > submission_fields.Id
submission_field_history.ChangedByUserId > users.Id

ai_analyses.SubmissionId > form_submissions.Id

conversation_messages.SubmissionId > form_submissions.Id

clarifications.SubmissionId > form_submissions.Id
clarifications.FormFieldId > form_fields.Id
clarifications.QuestionMessageId > conversation_messages.Id
clarifications.AnswerMessageId >conversation_messages.Id

business_rules.FormVersionId > form_versions.Id
rule_execution_results.SubmissionId > form_submissions.Id
rule_execution_results.BusinessRuleId > business_rules.Id

confirmations.SubmissionId - form_submissions.Id
confirmations.ConfirmedByUserId > users.Id



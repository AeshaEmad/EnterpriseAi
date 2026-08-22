using System.Text.Json;

namespace EnterpriseAI.Services.Implementations
{
    public static class SubmissionStatus
    {
        public const string Draft = "Draft";
        public const string AiFilled = "AI_Filled";
        public const string UserEdited = "User_Edited";
        public const string NeedsCorrection = "NeedsCorrection";
        public const string Validated = "Validated";
        public const string Confirmed = "Confirmed";

        private static readonly Dictionary<string, HashSet<string>> ValidTransitions = new()
        {
            [Draft] = new() { AiFilled, UserEdited, Validated },
            [AiFilled] = new() { AiFilled, UserEdited, Validated, NeedsCorrection },
            [UserEdited] = new() { UserEdited, AiFilled, Validated, NeedsCorrection },
            [NeedsCorrection] = new() { AiFilled, UserEdited, Draft },
            [Validated] = new() { Confirmed, NeedsCorrection, UserEdited },
        };

        public static void EnsureTransitionAllowed(string from, string to)
        {
            if (from == Confirmed)
            {
                throw new InvalidOperationException("A confirmed submission cannot be modified.");
            }

            if (ValidTransitions.TryGetValue(from, out var allowed) && allowed.Contains(to))
            {
                return;
            }

            throw new InvalidOperationException(
                $"Invalid status transition from '{from}' to '{to}'.");
        }
    }

    public class SubmissionService : ISubmissionService
    {
        private readonly AppDbContext _db;
        private readonly IBusinessRuleEngine _ruleEngine;
        private readonly IAiServiceClient _aiClient;

        public SubmissionService(AppDbContext db, IBusinessRuleEngine ruleEngine, IAiServiceClient aiClient)
        {
            _db = db;
            _ruleEngine = ruleEngine;
            _aiClient = aiClient;
        }

        public async Task<SubmissionDto> CreateAsync(CreateSubmissionDto dto, string userId, CancellationToken cancellationToken = default)
        {
            var form = await _db.Forms
                .AsNoTracking()
                .Include(f => f.Versions)
                .FirstOrDefaultAsync(f => f.Id == dto.FormId, cancellationToken);

            if (form is null)
            {
                throw new KeyNotFoundException("Form not found.");
            }

            var version = form.Versions
                .OrderByDescending(v => v.IsActive ? 1 : 0)
                .ThenByDescending(v => v.VersionNumber)
                .FirstOrDefault();

            if (version is null)
            {
                throw new InvalidOperationException("The form has no active version.");
            }

            var fields = await _db.FormFields
                .AsNoTracking()
                .Where(f => f.FormVersionId == version.Id)
                .ToListAsync(cancellationToken);

            var submission = new FormSubmission
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                FormVersionId = version.Id,
                Status = SubmissionStatus.Draft,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.FormSubmissions.Add(submission);

            var byName = fields.ToDictionary(f => f.FieldName, f => f);

            if (dto.InitialValues is not null)
            {
                foreach (var value in dto.InitialValues)
                {
                    if (!byName.TryGetValue(value.Name, out var formField))
                    {
                        continue;
                    }

                    _db.SubmissionFields.Add(value.ToEntity(submission.Id, formField));
                }
            }

            await _db.SaveChangesAsync(cancellationToken);
            return submission.ToDto(dto.FormId);
        }

        public async Task<SubmissionDto?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
        {
            var submission = await LoadSubmissionAsync(id, cancellationToken);
            return submission is null ? null : submission.ToDto(submission.FormVersion?.FormId ?? string.Empty);
        }

        public async Task<SubmissionDto> UpdateFieldsAsync(string id, UpdateSubmissionFieldsDto dto, string userId, CancellationToken cancellationToken = default)
        {
            var submission = await LoadSubmissionAsync(id, cancellationToken);
            if (submission is null)
            {
                throw new KeyNotFoundException("Submission not found.");
            }

            var targetStatus = dto.Values.Any(v => v.Source == SubmissionSource.User)
                ? SubmissionStatus.UserEdited
                : SubmissionStatus.AiFilled;

            SubmissionStatus.EnsureTransitionAllowed(submission.Status, targetStatus);

            var fields = await _db.FormFields
                .AsNoTracking()
                .Where(f => f.FormVersionId == submission.FormVersionId)
                .ToListAsync(cancellationToken);

            var byName = fields.ToDictionary(f => f.FieldName, f => f);
            var existingByName = submission.SubmissionFields
                .Where(f => f.FormField != null)
                .ToDictionary(f => f.FormField!.FieldName, f => f);

            foreach (var value in dto.Values)
            {
                if (!byName.TryGetValue(value.Name, out var formField))
                {
                    continue;
                }

                if (existingByName.TryGetValue(value.Name, out var existing))
                {
                    RecordHistory(existing, existing.Value, value.Value, value.Source, userId);

                    existing.Value = value.Value;
                    existing.Source = value.Source;
                    existing.UpdatedAt = DateTime.UtcNow;
                    _db.SubmissionFields.Update(existing);
                }
                else
                {
                    _db.SubmissionFields.Add(value.ToEntity(submission.Id, formField));
                }
            }

            submission.Status = targetStatus;
            submission.UpdatedAt = DateTime.UtcNow;
            _db.FormSubmissions.Update(submission);

            await _db.SaveChangesAsync(cancellationToken);

            return (await LoadSubmissionAsync(id, cancellationToken))!.ToDto(submission.FormVersion?.FormId ?? string.Empty);
        }

        public async Task<ExtractResultDto> ExtractAsync(string id, string userInput, string userId, CancellationToken cancellationToken = default)
        {
            var submission = await LoadSubmissionAsync(id, cancellationToken);
            if (submission is null)
            {
                throw new KeyNotFoundException("Submission not found.");
            }

            SubmissionStatus.EnsureTransitionAllowed(submission.Status, SubmissionStatus.AiFilled);

            var version = await _db.FormVersions
                .Include(v => v.Fields.OrderBy(f => f.DisplayOrder))
                .FirstOrDefaultAsync(v => v.Id == submission.FormVersionId, cancellationToken);

            if (version is null)
            {
                throw new KeyNotFoundException("Form version not found.");
            }

            var form = await _db.Forms
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == version.FormId, cancellationToken);

            var conversationHistory = await _db.ConversationMessages
                .AsNoTracking()
                .Where(m => m.SubmissionId == id)
                .OrderBy(m => m.SequenceNumber)
                .Select(m => new AiConversationTurn(m.Role, m.Content))
                .ToListAsync(cancellationToken);

            var sequenceNumber = conversationHistory.Count + 1;

            _db.ConversationMessages.Add(new ConversationMessage
            {
                Id = Guid.NewGuid().ToString(),
                SubmissionId = id,
                Role = "user",
                MessageType = "text",
                Content = userInput,
                SequenceNumber = sequenceNumber,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync(cancellationToken);

            var schemaDto = form is not null
                ? form.ToSchemaDto(version)
                : new FormSchemaDto(version.FormId, string.Empty, version.Id, version.VersionNumber, new List<FormSchemaFieldDto>());

            var aiRequest = new AiExtractRequest
            {
                FormSchema = schemaDto,
                UserInput = userInput,
                Context = new AiExtractContext
                {
                    ExistingValues = submission.SubmissionFields
                        .Where(f => f.Value is not null)
                        .ToDictionary(f => f.FormField?.FieldName ?? string.Empty, f => f.Value),
                    Conversation = conversationHistory
                }
            };

            var fields = version.Fields.OrderBy(field => field.DisplayOrder).ToList();
            var aiResponse = TryCreateDirectFieldResponse(userInput, fields, out var directResponse)
                ? directResponse
                : await _aiClient.ExtractAsync(aiRequest, cancellationToken);

            _db.AIAnalyses.Add(new AIAnalysis
            {
                Id = Guid.NewGuid().ToString(),
                SubmissionId = id,
                ModelName = aiResponse.ModelName,
                Status = "Completed",
                AnalysisResult = JsonSerializer.SerializeToNode(aiResponse.Values),
                MissingFields = JsonSerializer.SerializeToNode(aiResponse.MissingFields),
                AmbiguousFields = JsonSerializer.SerializeToNode(aiResponse.Clarifications),
                CreatedAt = DateTime.UtcNow
            });

            var byName = fields.ToDictionary(f => f.FieldName, f => f, StringComparer.OrdinalIgnoreCase);
            var existingByName = submission.SubmissionFields
                .Where(f => f.FormField != null)
                .ToDictionary(f => f.FormField!.FieldName, f => f, StringComparer.OrdinalIgnoreCase);

            var acceptedValues = new Dictionary<string, AiValueDto>(StringComparer.OrdinalIgnoreCase);

            var allowsCustomSelectValues = string.Equals(
                aiResponse.ModelName,
                "schema-direct",
                StringComparison.OrdinalIgnoreCase);

            foreach (var (fieldName, extractedValue) in aiResponse.Values)
            {
                if (!byName.TryGetValue(fieldName, out var formField) ||
                    !TryNormalizeFieldValue(
                        formField,
                        extractedValue.Value,
                        out var normalizedValue,
                        allowsCustomSelectValues))
                {
                    continue;
                }

                extractedValue.Value = normalizedValue;
                if (allowsCustomSelectValues)
                {
                    AddCustomSelectOption(formField, normalizedValue);
                }

                acceptedValues[formField.FieldName] = extractedValue;
            }

            var filledFields = new List<SubmissionFieldDto>();

            foreach (var kvp in acceptedValues)
            {
                var formField = byName[kvp.Key];

                if (existingByName.TryGetValue(kvp.Key, out var existing))
                {
                    RecordHistory(existing, existing.Value, kvp.Value.Value, "ai", userId);
                    existing.Value = kvp.Value.Value;
                    existing.Source = "ai";
                    existing.ConfidenceScore = kvp.Value.Confidence;
                    existing.UpdatedAt = DateTime.UtcNow;
                    _db.SubmissionFields.Update(existing);
                }
                else
                {
                    var newField = new SubmissionField
                    {
                        Id = Guid.NewGuid().ToString(),
                        SubmissionId = id,
                        FormFieldId = formField.Id,
                        Value = kvp.Value.Value,
                        Source = "ai",
                        ConfidenceScore = kvp.Value.Confidence,
                        IsConfirmed = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.SubmissionFields.Add(newField);
                    existingByName[kvp.Key] = newField;
                }

                filledFields.Add(new SubmissionFieldDto(
                    formField.Id, kvp.Key, formField.FieldLabel,
                    kvp.Value.Value, "ai", kvp.Value.Confidence, false));
            }

            var missingRequiredFields = fields
                .Where(field => field.IsRequired &&
                    (!existingByName.TryGetValue(field.FieldName, out var value) ||
                     !IsValidFieldValue(field, value.Value)))
                .OrderBy(field => field.DisplayOrder)
                .ToList();

            var missingFields = missingRequiredFields
                .Select(field => field.FieldName)
                .ToList();
            var missingFieldNames = missingFields.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var clarifications = aiResponse.Clarifications
                .Where(item => missingFieldNames.Contains(item.Field))
                .ToList();

            foreach (var field in missingRequiredFields)
            {
                if (clarifications.Any(item =>
                    string.Equals(item.Field, field.FieldName, StringComparison.OrdinalIgnoreCase)))
                {
                    continue;
                }

                var suggestions = GetAllowedOptions(field);
                var question = suggestions.Count > 0
                    ? $"Please provide {field.FieldLabel}. Choose one of: {string.Join(", ", suggestions)}."
                    : $"Please provide {field.FieldLabel}.";

                clarifications.Add(new AiClarificationDto(field.FieldName, question, suggestions));
            }

            aiResponse.Values = acceptedValues;
            aiResponse.MissingFields = missingFields;
            aiResponse.Clarifications = clarifications;

            _db.ConversationMessages.Add(new ConversationMessage
            {
                Id = Guid.NewGuid().ToString(),
                SubmissionId = id,
                Role = "assistant",
                MessageType = "ai_extraction",
                Content = JsonSerializer.Serialize(aiResponse),
                SequenceNumber = sequenceNumber + 1,
                CreatedAt = DateTime.UtcNow
            });

            submission.Status = SubmissionStatus.AiFilled;
            submission.UpdatedAt = DateTime.UtcNow;
            _db.FormSubmissions.Update(submission);

            await _db.SaveChangesAsync(cancellationToken);

            return new ExtractResultDto(
                filledFields,
                missingFields,
                clarifications.Select(c => new ClarificationDto(c.Field, c.Question, c.Suggestions)).ToList(),
                aiResponse.ModelName,
                id);
        }

        public async Task<ValidationResultDto> ValidateAsync(string id, CancellationToken cancellationToken = default)
        {
            var submission = await LoadSubmissionAsync(id, cancellationToken);
            if (submission is null)
            {
                throw new KeyNotFoundException("Submission not found.");
            }

            var rules = await _db.BusinessRules
                .AsNoTracking()
                .Where(r => r.FormVersionId == submission.FormVersionId && r.IsActive)
                .ToListAsync(cancellationToken);

            var fieldErrors = ValidateFields(submission, rules);
            var executionResults = await _ruleEngine.ExecuteAsync(submission, rules, cancellationToken);

            _db.RuleExecutionResults.AddRange(executionResults);

            var ruleNames = rules.ToDictionary(r => r.Id, r => r.Name);

            var ruleResults = executionResults
                .Where(r => r.Status != RuleExecutionStatus.Passed)
                .Select(r => new RuleResultDto(
                    r.BusinessRuleId,
                    ruleNames.TryGetValue(r.BusinessRuleId, out var name) ? name : string.Empty,
                    r.Status == RuleExecutionStatus.Passed,
                    r.Details ?? r.Status,
                    "error"))
                .ToList();

            var valid = fieldErrors.Count == 0 && ruleResults.Count == 0;

            var targetStatus = valid ? SubmissionStatus.Validated : SubmissionStatus.NeedsCorrection;
            SubmissionStatus.EnsureTransitionAllowed(submission.Status, targetStatus);

            submission.Status = targetStatus;
            submission.UpdatedAt = DateTime.UtcNow;
            _db.FormSubmissions.Update(submission);
            await _db.SaveChangesAsync(cancellationToken);

            return new ValidationResultDto(
                valid,
                fieldErrors,
                ruleResults,
                submission.Status);
        }

        public async Task<SubmissionDto?> ConfirmAsync(string id, string userId, CancellationToken cancellationToken = default)
        {
            var submission = await LoadSubmissionAsync(id, cancellationToken);
            if (submission is null)
            {
                throw new KeyNotFoundException("Submission not found.");
            }

            SubmissionStatus.EnsureTransitionAllowed(submission.Status, SubmissionStatus.Confirmed);

            submission.Status = SubmissionStatus.Confirmed;
            submission.SubmittedAt = DateTime.UtcNow;
            submission.UpdatedAt = DateTime.UtcNow;
            _db.FormSubmissions.Update(submission);

            _db.Confirmations.Add(new Confirmation
            {
                Id = Guid.NewGuid().ToString(),
                SubmissionId = submission.Id,
                ConfirmedByUserId = userId,
                Status = "Confirmed",
                ConfirmedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync(cancellationToken);

            return (await LoadSubmissionAsync(id, cancellationToken))!.ToDto(submission.FormVersion?.FormId ?? string.Empty);
        }

        private List<FieldErrorDto> ValidateFields(FormSubmission submission, List<BusinessRule> rules)
        {
            var errors = new List<FieldErrorDto>();

            var formFields = submission.FormVersion?.Fields
                .OrderBy(field => field.DisplayOrder)
                .ToList() ?? new List<FormField>();
            var valuesByFieldId = submission.SubmissionFields
                .ToDictionary(field => field.FormFieldId, field => field);

            foreach (var formField in formFields)
            {
                valuesByFieldId.TryGetValue(formField.Id, out var field);
                var hasValue = HasValue(field?.Value);

                if (formField.IsRequired && !hasValue)
                {
                    errors.Add(new FieldErrorDto(formField.FieldName, $"'{formField.FieldLabel}' is required."));
                    continue;
                }

                if (hasValue && !IsValidFieldValue(formField, field!.Value))
                {
                    var options = GetAllowedOptions(formField);
                    var message = options.Count > 0
                        ? $"'{formField.FieldLabel}' must be one of: {string.Join(", ", options)}."
                        : $"'{formField.FieldLabel}' has an invalid value.";
                    errors.Add(new FieldErrorDto(formField.FieldName, message));
                    continue;
                }

                if (!hasValue || formField.ValidationRules is not JsonObject validation)
                {
                    continue;
                }

                var fieldValue = field!.Value!;
                var text = fieldValue.ToJsonString();
                var number = TryGetNumber(fieldValue);

                if (validation.TryGetPropertyValue("minLength", out var minLengthNode) &&
                    minLengthNode is JsonValue minLengthValue &&
                    minLengthValue.TryGetValue<int>(out var minLength) &&
                    text.Length < minLength)
                {
                    errors.Add(new FieldErrorDto(formField.FieldName, $"'{formField.FieldLabel}' must be at least {minLength} characters."));
                }

                if (validation.TryGetPropertyValue("maxLength", out var maxLengthNode) &&
                    maxLengthNode is JsonValue maxLengthValue &&
                    maxLengthValue.TryGetValue<int>(out var maxLength) &&
                    text.Length > maxLength)
                {
                    errors.Add(new FieldErrorDto(formField.FieldName, $"'{formField.FieldLabel}' must be at most {maxLength} characters."));
                }

                if (validation.TryGetPropertyValue("min", out var minNode) &&
                    minNode is JsonValue minValue &&
                    minValue.TryGetValue<decimal>(out var min) &&
                    number is not null &&
                    number < min)
                {
                    errors.Add(new FieldErrorDto(formField.FieldName, $"'{formField.FieldLabel}' must be at least {min}."));
                }

                if (validation.TryGetPropertyValue("max", out var maxNode) &&
                    maxNode is JsonValue maxValue &&
                    maxValue.TryGetValue<decimal>(out var max) &&
                    number is not null &&
                    number > max)
                {
                    errors.Add(new FieldErrorDto(formField.FieldName, $"'{formField.FieldLabel}' must be at most {max}."));
                }
            }

            return errors;
        }

        private void RecordHistory(SubmissionField field, JsonNode? oldValue, JsonNode? newValue, string source, string userId)
        {
            _db.SubmissionFieldHistories.Add(new SubmissionFieldHistory
            {
                Id = Guid.NewGuid().ToString(),
                SubmissionFieldId = field.Id,
                OldValue = oldValue,
                NewValue = newValue,
                Source = source,
                ChangedByUserId = userId,
                Reason = $"Value changed from {oldValue?.ToJsonString() ?? "empty"} to {newValue?.ToJsonString() ?? "empty"}",
                ChangedAt = DateTime.UtcNow
            });
        }

        private async Task<FormSubmission?> LoadSubmissionAsync(string id, CancellationToken cancellationToken)
        {
            return await _db.FormSubmissions
                .Include(s => s.FormVersion)
                    .ThenInclude(v => v!.Fields)
                .Include(s => s.SubmissionFields)
                    .ThenInclude(f => f.FormField)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        }

        private static bool IsValidFieldValue(FormField field, JsonNode? value)
        {
            return TryNormalizeFieldValue(field, value, out _, allowCustomSelectValue: true);
        }

        private static bool TryCreateDirectFieldResponse(
            string userInput,
            IReadOnlyList<FormField> fields,
            out AiExtractResponse response)
        {
            response = new AiExtractResponse();

            const string prefix = "Please set ";
            if (!userInput.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            var separatorIndex = userInput.IndexOf(" to:", prefix.Length, StringComparison.OrdinalIgnoreCase);
            if (separatorIndex < 0)
            {
                return false;
            }

            var requestedField = userInput[prefix.Length..separatorIndex].Trim();
            var requestedValue = userInput[(separatorIndex + 4)..].Trim();
            var field = fields.FirstOrDefault(item =>
                string.Equals(item.FieldName, requestedField, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.FieldLabel, requestedField, StringComparison.OrdinalIgnoreCase));

            if (field is null || string.IsNullOrWhiteSpace(requestedValue))
            {
                return false;
            }

            response = new AiExtractResponse
            {
                Values = new Dictionary<string, AiValueDto>(StringComparer.OrdinalIgnoreCase)
                {
                    [field.FieldName] = new AiValueDto
                    {
                        Value = JsonValue.Create(requestedValue),
                        Confidence = 1
                    }
                },
                ModelName = "schema-direct"
            };

            return true;
        }

        private static bool TryNormalizeFieldValue(
            FormField field,
            JsonNode? value,
            out JsonNode? normalizedValue,
            bool allowCustomSelectValue = false)
        {
            normalizedValue = value;
            if (!HasValue(value))
            {
                return false;
            }

            var options = GetAllowedOptions(field);
            if (!string.Equals(field.FieldType, "select", StringComparison.OrdinalIgnoreCase) || options.Count == 0)
            {
                return true;
            }

            if (value is not JsonValue jsonValue || !jsonValue.TryGetValue<string>(out var text))
            {
                return false;
            }

            var canonicalOption = options.FirstOrDefault(option =>
                string.Equals(option, text.Trim(), StringComparison.OrdinalIgnoreCase));
            if (canonicalOption is null)
            {
                if (!allowCustomSelectValue)
                {
                    return false;
                }

                normalizedValue = JsonValue.Create(text.Trim());
                return true;
            }

            normalizedValue = JsonValue.Create(canonicalOption);
            return true;
        }

        private static bool HasValue(JsonNode? value)
        {
            if (value is null || value.GetValueKind() == JsonValueKind.Null)
            {
                return false;
            }

            return value is not JsonValue jsonValue ||
                   !jsonValue.TryGetValue<string>(out var text) ||
                   !string.IsNullOrWhiteSpace(text);
        }

        private static IReadOnlyList<string> GetAllowedOptions(FormField field)
        {
            if (field.Options is not JsonArray options)
            {
                return Array.Empty<string>();
            }

            return options
                .OfType<JsonValue>()
                .Select(value => value.TryGetValue<string>(out var option) ? option : null)
                .Where(option => !string.IsNullOrWhiteSpace(option))
                .Select(option => option!)
                .ToList();
        }

        private static void AddCustomSelectOption(FormField field, JsonNode? value)
        {
            if (!string.Equals(field.FieldType, "select", StringComparison.OrdinalIgnoreCase) ||
                value is not JsonValue jsonValue ||
                !jsonValue.TryGetValue<string>(out var text) ||
                string.IsNullOrWhiteSpace(text))
            {
                return;
            }

            var trimmed = text.Trim();
            var currentOptions = GetAllowedOptions(field);
            var exists = currentOptions.Any(option =>
                string.Equals(option, trimmed, StringComparison.OrdinalIgnoreCase));

            if (exists)
            {
                return;
            }

            var options = new JsonArray();
            foreach (var option in currentOptions)
            {
                options.Add(option);
            }

            options.Add(trimmed);
            field.Options = options;
        }

        private static decimal? TryGetNumber(JsonNode? node)
        {
            if (node is JsonValue value && value.TryGetValue<decimal>(out var d))
            {
                return d;
            }

            return null;
        }

        private static class SubmissionSource
        {
            public const string Ai = "ai";
            public const string User = "user";
        }

        private static class RuleExecutionStatus
        {
            public const string Passed = "Passed";
            public const string Failed = "Failed";
            public const string Error = "Error";
        }
    }
}

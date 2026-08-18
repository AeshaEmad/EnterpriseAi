using System.Text.Json;

namespace EnterpriseAI.Services.Implementations
{
    public class SubmissionService : ISubmissionService
    {
        private readonly AppDbContext _db;
        private readonly IBusinessRuleEngine _ruleEngine;

        public SubmissionService(AppDbContext db, IBusinessRuleEngine ruleEngine)
        {
            _db = db;
            _ruleEngine = ruleEngine;
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

            if (submission.Status == SubmissionStatus.Confirmed)
            {
                throw new InvalidOperationException("A confirmed submission cannot be edited.");
            }

            var fields = await _db.FormFields
                .AsNoTracking()
                .Where(f => f.FormVersionId == submission.FormVersionId)
                .ToListAsync(cancellationToken);

            var byName = fields.ToDictionary(f => f.FieldName, f => f);
            var existingByName = submission.SubmissionFields
                .Where(f => f.FormField != null)
                .ToDictionary(f => f.FormField!.FieldName, f => f);

            var seenSources = new HashSet<string>();

            foreach (var value in dto.Values)
            {
                if (!byName.TryGetValue(value.Name, out var formField))
                {
                    continue;
                }

                seenSources.Add(value.Source);

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

            submission.Status = seenSources.Contains(SubmissionSource.User)
                ? SubmissionStatus.UserEdited
                : seenSources.Contains(SubmissionSource.Ai)
                    ? SubmissionStatus.AiFilled
                    : SubmissionStatus.Draft;
            submission.UpdatedAt = DateTime.UtcNow;
            _db.FormSubmissions.Update(submission);

            await _db.SaveChangesAsync(cancellationToken);

            return (await LoadSubmissionAsync(id, cancellationToken))!.ToDto(submission.FormVersion?.FormId ?? string.Empty);
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

            submission.Status = valid ? SubmissionStatus.Validated : SubmissionStatus.NeedsCorrection;
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

            if (submission.Status != SubmissionStatus.Validated)
            {
                throw new InvalidOperationException("Submission must pass validation before confirmation.");
            }

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
            var fields = submission.SubmissionFields.ToDictionary(f => f.FormField?.FieldName ?? string.Empty, f => f);

            foreach (var field in submission.SubmissionFields.Where(f => f.FormField is not null))
            {
                var formField = field.FormField!;
                var hasValue = field.Value is not null &&
                               field.Value.GetValueKind() != JsonValueKind.Null &&
                               field.Value.ToJsonString() != "\"\"";

                if (formField.IsRequired && !hasValue)
                {
                    errors.Add(new FieldErrorDto(formField.FieldName, $"'{formField.FieldLabel}' is required."));
                    continue;
                }

                if (!hasValue || formField.ValidationRules is not JsonObject validation)
                {
                    continue;
                }

                var text = field.Value!.ToJsonString();
                var number = TryGetNumber(field.Value);

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
                .Include(s => s.SubmissionFields)
                    .ThenInclude(f => f.FormField)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        }

        private static decimal? TryGetNumber(JsonNode? node)
        {
            if (node is JsonValue value && value.TryGetValue<decimal>(out var d))
            {
                return d;
            }

            return null;
        }

        private static class SubmissionStatus
        {
            public const string Draft = "Draft";
            public const string AiFilled = "AI_Filled";
            public const string UserEdited = "User_Edited";
            public const string NeedsCorrection = "NeedsCorrection";
            public const string Validated = "Validated";
            public const string Confirmed = "Confirmed";
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

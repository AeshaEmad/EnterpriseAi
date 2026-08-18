namespace EnterpriseAI.Mappings
{
    public static class SubmissionMappings
    {
        public static SubmissionFieldDto ToDto(this SubmissionField field)
        {
            return new SubmissionFieldDto(
                field.FormFieldId,
                field.FormField?.FieldName ?? string.Empty,
                field.FormField?.FieldLabel ?? string.Empty,
                field.Value,
                field.Source,
                field.ConfidenceScore,
                field.IsConfirmed);
        }

        public static SubmissionDto ToDto(this FormSubmission submission, string formId)
        {
            return new SubmissionDto(
                submission.Id,
                formId,
                submission.FormVersionId,
                submission.Status,
                submission.CreatedAt,
                submission.UpdatedAt,
                submission.SubmittedAt,
                submission.SubmissionFields.OrderBy(f => f.FormField?.DisplayOrder ?? 0).Select(f => f.ToDto()).ToList());
        }

        public static SubmissionField ToEntity(this SubmissionFieldValueDto dto, string submissionId, FormField formField)
        {
            return new SubmissionField
            {
                Id = Guid.NewGuid().ToString(),
                SubmissionId = submissionId,
                FormFieldId = formField.Id,
                Value = dto.Value,
                Source = dto.Source,
                ConfidenceScore = null,
                IsConfirmed = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }
    }
}

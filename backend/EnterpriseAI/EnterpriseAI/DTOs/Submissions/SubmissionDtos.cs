namespace EnterpriseAI.DTOs.Submissions
{
    public record SubmissionFieldValueDto(
        string Name,
        JsonNode? Value,
        string Source);

    public class CreateSubmissionDto
    {
        [Required(ErrorMessage = "Form id is required.")]
        public string FormId { get; set; } = string.Empty;

        public IReadOnlyList<SubmissionFieldValueDto>? InitialValues { get; set; }
    }

    public class UpdateSubmissionFieldsDto
    {
        [Required]
        public IReadOnlyList<SubmissionFieldValueDto> Values { get; set; } = Array.Empty<SubmissionFieldValueDto>();
    }

    public record SubmissionFieldDto(
        string FormFieldId,
        string Name,
        string Label,
        JsonNode? Value,
        string Source,
        float? ConfidenceScore,
        bool IsConfirmed);

    public record SubmissionDto(
        string Id,
        string FormId,
        string FormVersionId,
        string Status,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        DateTime? SubmittedAt,
        IReadOnlyList<SubmissionFieldDto> Fields);

    public record FieldErrorDto(
        string Field,
        string Message);

    public record RuleResultDto(
        string RuleId,
        string Name,
        bool Passed,
        string Message,
        string Severity);

    public record ValidationResultDto(
        bool Valid,
        IReadOnlyList<FieldErrorDto> FieldErrors,
        IReadOnlyList<RuleResultDto> RuleResults,
        string SubmissionStatus);

    public record ExtractResultDto(
        IReadOnlyList<SubmissionFieldDto> FilledFields,
        IReadOnlyList<string> MissingFields,
        IReadOnlyList<ClarificationDto> Clarifications,
        string ModelName,
        string SubmissionId);

    public record ClarificationDto(
        string Field,
        string Question,
        IReadOnlyList<string> Suggestions);
}

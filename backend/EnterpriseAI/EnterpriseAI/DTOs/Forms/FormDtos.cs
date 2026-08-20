namespace EnterpriseAI.DTOs.Forms
{
    public record FormDto(
        string Id,
        string Name,
        string Description,
        bool IsActive,
        DateTime CreatedAt,
        DateTime UpdatedAt);

    public record FormDetailDto(
        string Id,
        string Name,
        string Description,
        bool IsActive,
        IReadOnlyList<FormVersionDto> Versions);

    public record FormVersionDto(
        string Id,
        string FormId,
        int VersionNumber,
        string Status,
        bool IsActive,
        DateTime CreatedAt,
        DateTime? PublishedAt);

    public record FormFieldDto(
        string Id,
        string FormVersionId,
        string FieldName,
        string FieldLabel,
        string FieldType,
        bool IsRequired,
        string? DefaultValue,
        JsonNode? Options,
        JsonNode? ValidationRules,
        int DisplayOrder);

    public class CreateFormDto
    {
        [Required(ErrorMessage = "Form name is required.")]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }

    public class CreateFormVersionDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Version number must be at least 1.")]
        public int VersionNumber { get; set; }

        public string Status { get; set; } = "Draft";
    }

    public record FormSchemaDto(
        string FormId,
        string FormName,
        string VersionId,
        int VersionNumber,
        IReadOnlyList<FormSchemaFieldDto> Fields);

    public record FormSchemaFieldDto(
        string Name,
        string Label,
        string Type,
        bool Required,
        string? DefaultValue,
        JsonNode? Options,
        JsonNode? Validation);

    public class CreateFormFieldDto
    {
        [Required(ErrorMessage = "Field name is required.")]
        public string FieldName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Field label is required.")]
        public string FieldLabel { get; set; } = string.Empty;

        [Required(ErrorMessage = "Field type is required.")]
        public string FieldType { get; set; } = "text";

        public bool IsRequired { get; set; }

        public string? DefaultValue { get; set; }

        public JsonNode? Options { get; set; }

        public JsonNode? ValidationRules { get; set; }

        public int DisplayOrder { get; set; }
    }

    public record ApprovalActionDto(string? Comment);
}

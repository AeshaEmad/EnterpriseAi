namespace EnterpriseAI.DTOs.BusinessRules
{
    public record BusinessRuleDto(
        string Id,
        string? FormVersionId,
        string FormId,
        string Name,
        string Description,
        string RuleType,
        JsonNode? Definition,
        int Priority,
        bool IsActive,
        DateTime CreatedAt,
        DateTime UpdatedAt);

    public class CreateBusinessRuleDto
    {
        [Required(ErrorMessage = "Form id is required.")]
        public string FormId { get; set; } = string.Empty;

        public string? FormVersionId { get; set; }

        [Required(ErrorMessage = "Rule name is required.")]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Rule type is required.")]
        public string RuleType { get; set; } = "field_value";

        [Required(ErrorMessage = "Rule definition is required.")]
        public JsonNode Definition { get; set; } = null!;

        public int Priority { get; set; } = 0;

        public bool IsActive { get; set; } = true;
    }

    public class UpdateBusinessRuleDto
    {
        [Required(ErrorMessage = "Rule name is required.")]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Rule type is required.")]
        public string RuleType { get; set; } = "field_value";

        [Required(ErrorMessage = "Rule definition is required.")]
        public JsonNode Definition { get; set; } = null!;

        public int Priority { get; set; } = 0;

        public bool IsActive { get; set; } = true;
    }
}

using System.Text.Json.Nodes;

namespace EnterpriseAI.Models
{
    public class FormField
    {
        public string Id { get; set; } = string.Empty;
        public string FormVersionId { get; set; } = string.Empty;
        public string FieldName { get; set; } = string.Empty;
        public string FieldLabel { get; set; } = string.Empty;
        public string FieldType { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
        public string? DefaultValue { get; set; }
        public JsonNode? Options { get; set; }
        public JsonNode? ValidationRules { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public FormVersion? FormVersion { get; set; }
        public ICollection<SubmissionField> SubmissionFields { get; set; } = new List<SubmissionField>();
        public ICollection<Clarification> Clarifications { get; set; } = new List<Clarification>();
    }
}

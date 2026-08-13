using System.Text.Json.Nodes;

namespace EnterpriseAI.Models
{
    public class BusinessRule
    {
        public string Id { get; set; } = string.Empty;
        public string? FormVersionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string RuleType { get; set; } = string.Empty;
        public JsonNode? Definition { get; set; }
        public int Priority { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public FormVersion? FormVersion { get; set; }
        public ICollection<RuleExecutionResult> ExecutionResults { get; set; } = new List<RuleExecutionResult>();
    }
}

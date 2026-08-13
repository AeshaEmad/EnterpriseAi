using System.Text.Json.Nodes;

namespace EnterpriseAI.Models
{
    public class RuleExecutionResult
    {
        public string Id { get; set; } = string.Empty;
        public string SubmissionId { get; set; } = string.Empty;
        public string BusinessRuleId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public JsonNode? Result { get; set; }
        public string? Details { get; set; }
        public DateTime ExecutedAt { get; set; }

        public FormSubmission? Submission { get; set; }
        public BusinessRule? BusinessRule { get; set; }
    }
}

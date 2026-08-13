using System.Text.Json.Nodes;

namespace EnterpriseAI.Models
{
    public class SubmissionFieldHistory
    {
        public string Id { get; set; } = string.Empty;
        public string SubmissionFieldId { get; set; } = string.Empty;
        public JsonNode? OldValue { get; set; }
        public JsonNode? NewValue { get; set; }
        public string Source { get; set; } = string.Empty;
        public string? ChangedByUserId { get; set; }
        public string? Reason { get; set; }
        public DateTime ChangedAt { get; set; }

        public SubmissionField? SubmissionField { get; set; }
        public User? ChangedByUser { get; set; }
    }
}

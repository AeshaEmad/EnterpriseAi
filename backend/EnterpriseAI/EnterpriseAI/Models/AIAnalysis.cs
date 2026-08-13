using System.Text.Json.Nodes;

namespace EnterpriseAI.Models
{
    public class AIAnalysis
    {
        public string Id { get; set; } = string.Empty;
        public string SubmissionId { get; set; } = string.Empty;
        public string ModelName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public JsonNode? AnalysisResult { get; set; }
        public JsonNode? MissingFields { get; set; }
        public JsonNode? AmbiguousFields { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; }

        public FormSubmission? Submission { get; set; }
    }
}

namespace EnterpriseAI.Models
{
    public class SubmissionField
    {
        public string Id { get; set; } = string.Empty;
        public string SubmissionId { get; set; } = string.Empty;
        public string FormFieldId { get; set; } = string.Empty;
        public JsonNode? Value { get; set; }
        public string Source { get; set; } = string.Empty;
        public float? ConfidenceScore { get; set; }
        public bool IsConfirmed { get; set; }
        public string? ConfirmedByUserId { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public FormSubmission? Submission { get; set; }
        public FormField? FormField { get; set; }
        public User? ConfirmedByUser { get; set; }
        public ICollection<SubmissionFieldHistory> HistoryEntries { get; set; } = new List<SubmissionFieldHistory>();
    }
}

namespace EnterpriseAI.Models
{
    public class FormSubmission
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string FormVersionId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }

        public User? User { get; set; }
        public FormVersion? FormVersion { get; set; }
        public ICollection<SubmissionField> SubmissionFields { get; set; } = new List<SubmissionField>();
        public ICollection<AIAnalysis> Analyses { get; set; } = new List<AIAnalysis>();
        public ICollection<ConversationMessage> ConversationMessages { get; set; } = new List<ConversationMessage>();
        public ICollection<Clarification> Clarifications { get; set; } = new List<Clarification>();
        public ICollection<RuleExecutionResult> RuleExecutionResults { get; set; } = new List<RuleExecutionResult>();
        public ICollection<Confirmation> Confirmations { get; set; } = new List<Confirmation>();
    }
}

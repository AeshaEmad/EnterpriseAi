namespace EnterpriseAI.Models
{
    public class Clarification
    {
        public string Id { get; set; } = string.Empty;
        public string SubmissionId { get; set; } = string.Empty;
        public string? FormFieldId { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string? UserAnswer { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? AnsweredAt { get; set; }
        public string QuestionMessageId { get; set; } = string.Empty;
        public string? AnswerMessageId { get; set; }

        public FormSubmission? Submission { get; set; }
        public FormField? FormField { get; set; }
        public ConversationMessage? QuestionMessage { get; set; }
        public ConversationMessage? AnswerMessage { get; set; }
    }
}

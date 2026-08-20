namespace EnterpriseAI.Models
{
    public class ConversationMessage
    {
        public string Id { get; set; } = string.Empty;
        public string SubmissionId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string MessageType { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int SequenceNumber { get; set; }
        public JsonNode? Metadata { get; set; }
        public DateTime CreatedAt { get; set; }

        public FormSubmission? Submission { get; set; }
        public ICollection<Clarification> QuestionClarifications { get; set; } = new List<Clarification>();
        public ICollection<Clarification> AnswerClarifications { get; set; } = new List<Clarification>();
    }
}

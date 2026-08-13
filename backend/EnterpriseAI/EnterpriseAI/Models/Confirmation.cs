namespace EnterpriseAI.Models
{
    public class Confirmation
    {
        public string Id { get; set; } = string.Empty;
        public string SubmissionId { get; set; } = string.Empty;
        public string ConfirmedByUserId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ConfirmedAt { get; set; }
        public DateTime CreatedAt { get; set; }

        public FormSubmission? Submission { get; set; }
        public User? ConfirmedByUser { get; set; }
    }
}

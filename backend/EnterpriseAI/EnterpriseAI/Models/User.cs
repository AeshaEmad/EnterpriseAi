namespace EnterpriseAI.Models
{
    public class User
    {
        public string Id { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ICollection<UserProfileAttribute> ProfileAttributes { get; set; } = new List<UserProfileAttribute>();
        public ICollection<FormSubmission> Submissions { get; set; } = new List<FormSubmission>();
        public ICollection<SubmissionField> ConfirmedSubmissionFields { get; set; } = new List<SubmissionField>();
        public ICollection<SubmissionFieldHistory> FieldHistoryChanges { get; set; } = new List<SubmissionFieldHistory>();
        public ICollection<Confirmation> Confirmations { get; set; } = new List<Confirmation>();
        public ICollection<UserFormAccess> FormAccesses { get; set; } = new List<UserFormAccess>();

    }
}

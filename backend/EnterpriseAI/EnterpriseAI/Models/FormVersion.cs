namespace EnterpriseAI.Models
{
    public class FormVersion
    {
        public string Id { get; set; } = string.Empty;
        public string FormId { get; set; } = string.Empty;
        public int VersionNumber { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Form? Form { get; set; }
        public ICollection<FormField> Fields { get; set; } = new List<FormField>();
        public ICollection<FormSubmission> Submissions { get; set; } = new List<FormSubmission>();
        public ICollection<BusinessRule> BusinessRules { get; set; } = new List<BusinessRule>();
    }
}

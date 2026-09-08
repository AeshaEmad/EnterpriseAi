namespace EnterpriseAI.Models
{
    public class Form
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ICollection<FormVersion> Versions { get; set; } = new List<FormVersion>();
        public ICollection<UserFormAccess> UserAccesses { get; set; } = new List<UserFormAccess>();
    }
}

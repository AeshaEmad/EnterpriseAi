namespace EnterpriseAI.Models
{
    public class UserFormAccess
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string FormId { get; set; } = string.Empty;
        public string GrantedByUserId { get; set; } = string.Empty;
        public DateTime GrantedAt { get; set; }

        public User? User { get; set; }
        public Form? Form { get; set; }
        public User? GrantedByUser { get; set; }
    }
}
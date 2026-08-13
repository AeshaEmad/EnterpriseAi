using System.Text.Json.Nodes;

namespace EnterpriseAI.Models
{
    public class UserProfileAttribute
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string AttributeKey { get; set; } = string.Empty;
        public JsonNode? Value { get; set; }
        public string DataType { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public User? User { get; set; }
    }
}

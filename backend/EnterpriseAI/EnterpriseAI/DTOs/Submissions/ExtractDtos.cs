using System.Text.Json.Serialization;

namespace EnterpriseAI.DTOs.Submissions
{
    public class AiExtractRequest
    {
        [JsonPropertyName("form_schema")]
        public FormSchemaDto FormSchema { get; set; } = null!;

        [JsonPropertyName("user_input")]
        public string UserInput { get; set; } = string.Empty;

        [JsonPropertyName("context")]
        public AiExtractContext Context { get; set; } = new();
    }

    public class AiExtractContext
    {
        [JsonPropertyName("existingValues")]
        public Dictionary<string, JsonNode?> ExistingValues { get; set; } = new();

        [JsonPropertyName("conversation")]
        public IReadOnlyList<AiConversationTurn> Conversation { get; set; } = Array.Empty<AiConversationTurn>();
    }

    public record AiConversationTurn(
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("content")] string Content);

    public class AiExtractResponse
    {
        [JsonPropertyName("values")]
        public Dictionary<string, AiValueDto> Values { get; set; } = new();

        [JsonPropertyName("missingFields")]
        public IReadOnlyList<string> MissingFields { get; set; } = Array.Empty<string>();

        [JsonPropertyName("clarifications")]
        public IReadOnlyList<AiClarificationDto> Clarifications { get; set; } = Array.Empty<AiClarificationDto>();

        [JsonPropertyName("modelName")]
        public string ModelName { get; set; } = string.Empty;
    }

    public class AiValueDto
    {
        [JsonPropertyName("value")]
        public JsonNode? Value { get; set; }

        [JsonPropertyName("confidence")]
        public float Confidence { get; set; }
    }

    public record AiClarificationDto(
        [property: JsonPropertyName("field")] string Field,
        [property: JsonPropertyName("question")] string Question,
        [property: JsonPropertyName("suggestions")] IReadOnlyList<string> Suggestions);

    public record AiErrorResponse(
        [property: JsonPropertyName("code")] string Code,
        [property: JsonPropertyName("message")] string Message);
}

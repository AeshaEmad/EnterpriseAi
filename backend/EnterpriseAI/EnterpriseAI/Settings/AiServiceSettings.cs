namespace EnterpriseAI.Settings
{
    public class AiServiceSettings
    {
        public string BaseUrl { get; set; } = "https://api.groq.com/openai/v1";
        public string ExtractEndpoint { get; set; } = "/chat/completions";
        public string? ApiKey { get; set; }
        public string Model { get; set; } = "llama-3.3-70b-versatile";
        public string Provider { get; set; } = "Groq";
        public int TimeoutSeconds { get; set; } = 60;
    }
}

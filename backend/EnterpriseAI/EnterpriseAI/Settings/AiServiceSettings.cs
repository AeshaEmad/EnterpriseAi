namespace EnterpriseAI.Settings
{
    public class AiServiceSettings
    {
        public string BaseUrl { get; set; } = "http://localhost:8000";
        public string ExtractEndpoint { get; set; } = "/api/v1/extract";
        public string? ApiKey { get; set; }
        public int TimeoutSeconds { get; set; } = 120;
    }
}

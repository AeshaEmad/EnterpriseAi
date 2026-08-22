using System.Net.Http.Json;
using System.Text.Json;

namespace EnterpriseAI.Services.Implementations
{
    public class AiServiceClient : IAiServiceClient
    {
        private readonly HttpClient _httpClient;
        private readonly AiServiceSettings _settings;
        private readonly ILogger<AiServiceClient> _logger;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };

        public AiServiceClient(
            HttpClient httpClient,
            IOptions<AiServiceSettings> settings,
            ILogger<AiServiceClient> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task<AiExtractResponse> ExtractAsync(AiExtractRequest request, CancellationToken cancellationToken = default)
        {
            var url = $"{_settings.BaseUrl.TrimEnd('/')}{_settings.ExtractEndpoint}";

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = JsonContent.Create(request, options: JsonOptions)
            };

            if (!string.IsNullOrWhiteSpace(_settings.ApiKey))
            {
                httpRequest.Headers.Add("X-AI-Service-Key", _settings.ApiKey);
            }

            try
            {
                using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<AiExtractResponse>(JsonOptions, cancellationToken);
                    return result ?? new AiExtractResponse();
                }

                if (response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable)
                {
                    throw new InvalidOperationException("AI model is currently unavailable. Please try again later.");
                }

                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("AI service returned {StatusCode}: {Error}", response.StatusCode, errorContent);
                throw new InvalidOperationException($"AI service returned an error: {response.StatusCode}");
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to connect to AI service at {Url}", url);
                throw new InvalidOperationException("AI service is unreachable. Please ensure the AI service is running.");
            }
        }
    }
}

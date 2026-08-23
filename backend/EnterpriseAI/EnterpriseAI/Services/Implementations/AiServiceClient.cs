using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;

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
            // If an API Key is present (e.g. Groq / OpenAI), use Cloud LLM direct completions
            if (!string.IsNullOrWhiteSpace(_settings.ApiKey))
            {
                return await ExtractWithCloudLlmAsync(request, cancellationToken);
            }

            return await ExtractWithMicroserviceAsync(request, cancellationToken);
        }

        private async Task<AiExtractResponse> ExtractWithCloudLlmAsync(AiExtractRequest request, CancellationToken cancellationToken)
        {
            var url = string.IsNullOrWhiteSpace(_settings.BaseUrl) || _settings.BaseUrl.Contains("localhost")
                ? "https://api.groq.com/openai/v1/chat/completions"
                : $"{_settings.BaseUrl.TrimEnd('/')}{_settings.ExtractEndpoint}";

            if (!url.EndsWith("/chat/completions", StringComparison.OrdinalIgnoreCase))
            {
                url = $"{url.TrimEnd('/')}/chat/completions";
            }

            var model = string.IsNullOrWhiteSpace(_settings.Model) ? "llama-3.3-70b-versatile" : _settings.Model;

            var inputPayload = new
            {
                form_schema = request.FormSchema,
                user_input = request.UserInput,
                context = request.Context
            };

            var userContent = JsonSerializer.Serialize(inputPayload, JsonOptions);

            var groqRequest = new
            {
                model,
                messages = new object[]
                {
                    new { role = "system", content = AiPrompts.AutoFillerSystemPrompt },
                    new { role = "user", content = userContent }
                },
                response_format = new { type = "json_object" },
                temperature = 0
            };

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = JsonContent.Create(groqRequest)
            };

            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey.Trim());

            try
            {
                using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError("Cloud LLM API error ({StatusCode}): {Body}", response.StatusCode, errorBody);
                    throw new InvalidOperationException($"Cloud AI API error ({response.StatusCode}): {errorBody}");
                }

                var jsonNode = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
                var contentString = jsonNode?["choices"]?[0]?["message"]?["content"]?.GetValue<string>();

                if (string.IsNullOrWhiteSpace(contentString))
                {
                    throw new InvalidOperationException("Cloud LLM returned an empty response.");
                }

                var extractResponse = JsonSerializer.Deserialize<AiExtractResponse>(contentString, JsonOptions)
                    ?? new AiExtractResponse();

                extractResponse.ModelName = model;
                return extractResponse;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to connect to Cloud LLM at {Url}", url);
                throw new InvalidOperationException($"Cloud AI service is unreachable: {ex.Message}");
            }
        }

        private async Task<AiExtractResponse> ExtractWithMicroserviceAsync(AiExtractRequest request, CancellationToken cancellationToken)
        {
            var url = $"{_settings.BaseUrl.TrimEnd('/')}{_settings.ExtractEndpoint}";

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = JsonContent.Create(request, options: JsonOptions)
            };

            try
            {
                using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<AiExtractResponse>(JsonOptions, cancellationToken);
                    return result ?? new AiExtractResponse();
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

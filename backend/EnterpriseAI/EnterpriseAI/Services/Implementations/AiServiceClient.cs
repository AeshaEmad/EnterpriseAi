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

            var model = string.IsNullOrWhiteSpace(_settings.Model) ? "openai/gpt-oss-120b" : _settings.Model;

            var inputPayload = new
            {
                form_schema = request.FormSchema,
                user_input = request.UserInput,
                context = request.Context
            };

            var userContent = $"Please extract the form data from the following input and return ONLY a valid JSON object matching the contract:\n{JsonSerializer.Serialize(inputPayload, JsonOptions)}";

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

                return ParseExtractionResponse(contentString, model);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to connect to Cloud LLM at {Url}", url);
                throw new InvalidOperationException($"Cloud AI service is unreachable: {ex.Message}");
            }
        }

        private static AiExtractResponse ParseExtractionResponse(string contentString, string modelName)
        {
            var cleaned = contentString.Trim();
            if (cleaned.StartsWith("```"))
            {
                var firstLineEnd = cleaned.IndexOf('\n');
                if (firstLineEnd >= 0) cleaned = cleaned[(firstLineEnd + 1)..];
                var lastCodeBlock = cleaned.LastIndexOf("```", StringComparison.Ordinal);
                if (lastCodeBlock >= 0) cleaned = cleaned[..lastCodeBlock].Trim();
            }

            var rootNode = JsonNode.Parse(cleaned);
            var result = new AiExtractResponse { ModelName = modelName };

            if (rootNode is not JsonObject rootObj)
            {
                return result;
            }

            if (rootObj.TryGetPropertyValue("values", out var valuesNode) && valuesNode is JsonObject valuesObj)
            {
                foreach (var (key, val) in valuesObj)
                {
                    if (val is null) continue;

                    if (val is JsonObject nestedObj && nestedObj.TryGetPropertyValue("value", out var innerVal))
                    {
                        var confidence = 1.0f;
                        if (nestedObj.TryGetPropertyValue("confidence", out var confNode) && confNode is JsonValue confVal && confVal.TryGetValue<float>(out var c))
                        {
                            confidence = c;
                        }

                        result.Values[key] = new AiValueDto
                        {
                            Value = innerVal?.DeepClone(),
                            Confidence = confidence
                        };
                    }
                    else
                    {
                        result.Values[key] = new AiValueDto
                        {
                            Value = val.DeepClone(),
                            Confidence = 0.95f
                        };
                    }
                }
            }

            if (rootObj.TryGetPropertyValue("missingFields", out var missingNode) && missingNode is JsonArray missingArr)
            {
                var list = new List<string>();
                foreach (var item in missingArr)
                {
                    if (item is JsonValue strVal && strVal.TryGetValue<string>(out var s) && !string.IsNullOrWhiteSpace(s))
                    {
                        list.Add(s);
                    }
                }
                result.MissingFields = list;
            }

            if (rootObj.TryGetPropertyValue("clarifications", out var clarifyNode) && clarifyNode is JsonArray clarifyArr)
            {
                var list = new List<AiClarificationDto>();
                foreach (var item in clarifyArr)
                {
                    if (item is JsonObject clarifyObj)
                    {
                        var field = clarifyObj["field"]?.GetValue<string>() ?? string.Empty;
                        var question = clarifyObj["question"]?.GetValue<string>() ?? string.Empty;
                        var suggestions = new List<string>();
                        if (clarifyObj["suggestions"] is JsonArray sugArr)
                        {
                            foreach (var s in sugArr)
                            {
                                if (s is JsonValue sv && sv.TryGetValue<string>(out var str)) suggestions.Add(str);
                            }
                        }
                        list.Add(new AiClarificationDto(field, question, suggestions));
                    }
                }
                result.Clarifications = list;
            }

            return result;
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

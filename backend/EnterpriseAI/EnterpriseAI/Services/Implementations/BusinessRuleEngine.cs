using System.Text.Json;

namespace EnterpriseAI.Services.Implementations
{
    public class BusinessRuleEngine : IBusinessRuleEngine
    {
        private readonly IRepository<UserProfileAttribute> _clientAttributes;

        public BusinessRuleEngine(IRepository<UserProfileAttribute> clientAttributes)
        {
            _clientAttributes = clientAttributes;
        }

        public async Task<IReadOnlyList<RuleExecutionResult>> ExecuteAsync(
            FormSubmission submission,
            IReadOnlyList<BusinessRule> rules,
            CancellationToken cancellationToken = default)
        {
            var results = new List<RuleExecutionResult>();

            if (rules.Count == 0)
            {
                return results;
            }

            var fields = submission.SubmissionFields.ToDictionary(f => f.FormField?.FieldName ?? string.Empty, f => f);
            var executedAt = DateTime.UtcNow;

            var rulesByPriority = rules
                .Where(r => r.IsActive)
                .OrderBy(r => r.Priority);

            foreach (var rule in rulesByPriority)
            {
                var (status, message, details) = await EvaluateAsync(rule, fields, cancellationToken);

                results.Add(new RuleExecutionResult
                {
                    Id = Guid.NewGuid().ToString(),
                    SubmissionId = submission.Id,
                    BusinessRuleId = rule.Id,
                    Status = status,
                    Result = JsonNode.Parse($"{{\"name\": {JsonSerializer.Serialize(rule.Name)}}}"),
                    Details = details ?? message,
                    ExecutedAt = executedAt
                });
            }

            return results;
        }

        private async Task<(string Status, string Message, string? Details)> EvaluateAsync(
            BusinessRule rule,
            IDictionary<string, SubmissionField> fields,
            CancellationToken cancellationToken)
        {
            try
            {
                var definition = rule.Definition?.AsObject();
                if (definition is null)
                {
                    return (RuleStatus.Error, "Rule definition is missing.", "Rule has no definition.");
                }

                switch (rule.RuleType)
                {
                    case "field_value":
                        return EvaluateFieldValue(rule, definition, fields);
                    case "cross_field":
                        return EvaluateCrossField(rule, definition, fields);
                    case "client_limit":
                        return await EvaluateClientLimitAsync(rule, definition, fields, cancellationToken);
                    default:
                        return (RuleStatus.Error, $"Unsupported rule type: {rule.RuleType}.", $"Rule type '{rule.RuleType}' is not supported.");
                }
            }
            catch (Exception)
            {
                return (RuleStatus.Error, $"Failed to execute rule '{rule.Name}'.", "An unexpected error occurred while executing the rule.");
            }
        }

        private static (string Status, string Message, string? Details) EvaluateFieldValue(
            BusinessRule rule,
            JsonObject definition,
            IDictionary<string, SubmissionField> fields)
        {
            var fieldName = definition["field"]?.GetValue<string>() ?? string.Empty;
            var op = definition["operator"]?.GetValue<string>() ?? string.Empty;
            var expected = definition["value"];
            var customMessage = definition["message"]?.GetValue<string>();

            var actual = fields.TryGetValue(fieldName, out var field) ? field.Value : null;

            var passed = Compare(actual, op, expected);
            var message = customMessage ?? (passed
                ? $"Rule '{rule.Name}' passed."
                : $"Rule '{rule.Name}' failed for field '{fieldName}'.");

            return passed
                ? (RuleStatus.Passed, message, null)
                : (RuleStatus.Failed, message, null);
        }

        private static (string Status, string Message, string? Details) EvaluateCrossField(
            BusinessRule rule,
            JsonObject definition,
            IDictionary<string, SubmissionField> fields)
        {
            var names = definition["fields"]?.AsArray()
                .Select(n => n?.GetValue<string>() ?? string.Empty)
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .ToList() ?? new List<string>();

            if (names.Count < 2)
            {
                return (RuleStatus.Error, $"Rule '{rule.Name}' requires at least two fields.", "cross_field definition must include 'fields' with two field names.");
            }

            var customMessage = definition["message"]?.GetValue<string>();
            var op = definition["operator"]?.GetValue<string>() ?? "equals";

            var values = names
                .Select(n => fields.TryGetValue(n, out var f) ? f.Value : null)
                .ToList();

            bool passed = op switch
            {
                "equals" => values.Distinct(JsonNodeValueEqualityComparer.Instance).Count() <= 1,
                "not_equals" => values.Distinct(JsonNodeValueEqualityComparer.Instance).Count() > 1,
                _ => false
            };

            var message = customMessage ?? (passed
                ? $"Rule '{rule.Name}' passed."
                : $"Rule '{rule.Name}' failed: fields '{string.Join("', '", names)}' are inconsistent.");

            return passed
                ? (RuleStatus.Passed, message, null)
                : (RuleStatus.Failed, message, null);
        }

        private async Task<(string Status, string Message, string? Details)> EvaluateClientLimitAsync(
            BusinessRule rule,
            JsonObject definition,
            IDictionary<string, SubmissionField> fields,
            CancellationToken cancellationToken)
        {
            var fieldName = definition["field"]?.GetValue<string>() ?? string.Empty;
            var op = definition["operator"]?.GetValue<string>() ?? string.Empty;
            var clientField = definition["clientField"]?.GetValue<string>();
            var attributeKey = definition["clientAttribute"]?.GetValue<string>();
            var customMessage = definition["message"]?.GetValue<string>();

            var actual = fields.TryGetValue(fieldName, out var field) ? field.Value : null;

            JsonNode? limit = null;

            if (!string.IsNullOrWhiteSpace(clientField) && !string.IsNullOrWhiteSpace(attributeKey))
            {
                var clientId = GetString(fields.TryGetValue(clientField, out var cf) ? cf.Value : null);
                if (!string.IsNullOrWhiteSpace(clientId))
                {
                    var attribute = await _clientAttributes.GetFirstAsync(
                        a => a.UserId == clientId && a.AttributeKey == attributeKey, cancellationToken);

                    limit = attribute?.Value;
                }
            }
            else
            {
                limit = definition["value"];
            }

            if (limit is null)
            {
                return (RuleStatus.Failed, $"Rule '{rule.Name}' failed: client limit could not be resolved.", "No client attribute found for the given client.");
            }

            var passed = Compare(actual, op, limit);
            var message = customMessage ?? (passed
                ? $"Rule '{rule.Name}' passed."
                : $"Rule '{rule.Name}' failed for field '{fieldName}'.");

            return passed
                ? (RuleStatus.Passed, message, null)
                : (RuleStatus.Failed, message, null);
        }

        private static bool Compare(JsonNode? actual, string op, JsonNode? expected)
        {
            var actualString = GetString(actual);
            var expectedString = GetString(expected);

            switch (op)
            {
                case "==":
                    return string.Equals(actualString, expectedString, StringComparison.OrdinalIgnoreCase);
                case "!=":
                    return !string.Equals(actualString, expectedString, StringComparison.OrdinalIgnoreCase);
                case ">":
                case ">=":
                case "<":
                case "<=":
                    if (TryGetDecimal(actual, out var a) && TryGetDecimal(expected, out var e))
                    {
                        return op switch
                        {
                            ">" => a > e,
                            ">=" => a >= e,
                            "<" => a < e,
                            _ => a <= e
                        };
                    }

                    return false;
                case "contains":
                    return actualString is not null && expectedString is not null &&
                           actualString.Contains(expectedString, StringComparison.OrdinalIgnoreCase);
                case "not_contains":
                    return actualString is not null && expectedString is not null &&
                           !actualString.Contains(expectedString, StringComparison.OrdinalIgnoreCase);
                case "is_required":
                    return !string.IsNullOrWhiteSpace(actualString);
                default:
                    return false;
            }
        }

        private static string? GetString(JsonNode? node)
        {
            if (node is null)
            {
                return null;
            }

            if (node is JsonValue value)
            {
                if (value.TryGetValue<string>(out var s))
                {
                    return s;
                }

                if (value.TryGetValue<decimal>(out var d))
                {
                    return d.ToString(System.Globalization.CultureInfo.InvariantCulture);
                }

                if (value.TryGetValue<long>(out var l))
                {
                    return l.ToString();
                }
            }

            return node.ToJsonString();
        }

        private static bool TryGetDecimal(JsonNode? node, out decimal result)
        {
            if (node is JsonValue value && value.TryGetValue<decimal>(out var d))
            {
                result = d;
                return true;
            }

            if (GetString(node) is { } s && decimal.TryParse(s, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var parsed))
            {
                result = parsed;
                return true;
            }

            result = 0;
            return false;
        }

        private static class RuleStatus
        {
            public const string Passed = "Passed";
            public const string Failed = "Failed";
            public const string Error = "Error";
        }

        private sealed class JsonNodeValueEqualityComparer : IEqualityComparer<JsonNode?>
        {
            public static readonly JsonNodeValueEqualityComparer Instance = new();

            public bool Equals(JsonNode? x, JsonNode? y)
            {
                return string.Equals(GetString(x), GetString(y), StringComparison.OrdinalIgnoreCase);
            }

            public int GetHashCode(JsonNode? obj)
            {
                return GetString(obj)?.ToLowerInvariant().GetHashCode() ?? 0;
            }
        }
    }
}

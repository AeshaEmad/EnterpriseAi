namespace EnterpriseAI.DTOs.Common
{
    public record ErrorResponse(string Code, string Message, string? Details);

    public record ErrorResponseEnvelope(ErrorResponse Error);
}

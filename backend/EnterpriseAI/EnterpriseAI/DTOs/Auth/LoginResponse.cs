namespace EnterpriseAI.DTOs.Auth
{
    public record LoginResponse(string Token, DateTime ExpiresAt, UserDto User);
}

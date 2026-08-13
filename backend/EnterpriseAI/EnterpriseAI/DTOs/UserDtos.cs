namespace EnterpriseAI.DTOs
{
    public record UserDto(
        string Id,
        string FullName,
        string Email,
        string Role,
        bool IsActive,
        DateTime CreatedAt,
        DateTime UpdatedAt);

    public record CreateUserDto(
        string FullName,
        string Email,
        string PasswordHash,
        string Role);

    public record UpdateUserDto(
        string FullName,
        string Role,
        bool IsActive);
}

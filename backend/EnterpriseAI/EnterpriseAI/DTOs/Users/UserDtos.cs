namespace EnterpriseAI.DTOs.Users
{
    public record UserDto(
        string Id,
        string FullName,
        string Email,
        string Role,
        bool IsActive,
        DateTime CreatedAt,
        DateTime UpdatedAt);

    public class CreateUserDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string Password { get; set; } = string.Empty;

        public string Role { get; set; } = "User";
    }

    public record UpdateUserDto(
        string FullName,
        string Role,
        bool IsActive);
}

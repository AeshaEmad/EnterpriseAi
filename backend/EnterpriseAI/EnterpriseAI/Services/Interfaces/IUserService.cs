using EnterpriseAI.DTOs;

namespace EnterpriseAI.Services.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<UserDto?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
        Task<UserDto> CreateAsync(CreateUserDto dto, CancellationToken cancellationToken = default);
        Task<UserDto?> UpdateAsync(string id, UpdateUserDto dto, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
    }
}

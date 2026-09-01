namespace EnterpriseAI.Services.Interfaces
{
    public interface IFormAccessService
    {
        Task<UserFormAccessDto> GrantAccessAsync(AssignFormAccessDto dto, string grantedByUserId, CancellationToken cancellationToken = default);
        Task<bool> RevokeAccessAsync(string userId, string formId, CancellationToken cancellationToken = default);
        Task<IEnumerable<UserFormAccessDto>> GetAccessForUserAsync(string userId, CancellationToken cancellationToken = default);
        Task<bool> HasAccessAsync(string userId, string formId, CancellationToken cancellationToken = default);
    }
}